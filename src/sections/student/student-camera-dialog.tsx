'use client';
import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
export function StudentCameraDialog({onClose,onPhoto,onFallback}:{onClose:()=>void;onPhoto:(file:File)=>void;onFallback:()=>void}){
 const video=useRef<HTMLVideoElement|null>(null);const stream=useRef<MediaStream|null>(null);const [error,setError]=useState(false);const [ready,setReady]=useState(false);
 useEffect(()=>{let disposed=false;const stop=(s:MediaStream)=>s.getTracks().forEach(track=>track.stop());
 if(!navigator.mediaDevices?.getUserMedia){setError(true);return undefined;}
 navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false}).then(s=>{if(disposed){stop(s);return;}stream.current=s;if(video.current)video.current.srcObject=s;}).catch(()=>{if(!disposed)setError(true);});return()=>{disposed=true;if(stream.current)stop(stream.current);};},[]);
 const capture=()=>{if(!video.current?.videoWidth)return;const canvas=document.createElement('canvas');const factor=Math.min(1,1600/video.current.videoWidth);canvas.width=Math.round(video.current.videoWidth*factor);canvas.height=Math.round(video.current.videoHeight*factor);canvas.getContext('2d')?.drawImage(video.current,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{if(blob){onPhoto(new File([blob],'foto-aluno.jpg',{type:'image/jpeg'}));onClose();}},'image/jpeg',.9);};
 return <Dialog open onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="camera-title"><DialogTitle id="camera-title">Foto do aluno</DialogTitle><DialogContent>{error?<Alert severity="info">Não foi possível acessar a câmera. Confira a permissão do navegador ou envie uma foto do aparelho.</Alert>:<Box component="video" ref={video} autoPlay playsInline muted onLoadedData={()=>setReady(true)} sx={{width:1,borderRadius:2,bgcolor:'grey.900'}}/>}</DialogContent><DialogActions><Button color="inherit" onClick={onClose}>Cancelar</Button>{error?<Button onClick={()=>{onClose();onFallback();}}>Usar câmera do aparelho</Button>:<Button variant="contained" disabled={!ready} onClick={capture}>Tirar foto</Button>}</DialogActions></Dialog>;
}
