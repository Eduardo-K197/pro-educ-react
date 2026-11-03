import type { PopoverProps } from '@mui/material/Popover';
import type { Theme, SxProps } from '@mui/material/styles';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';

export type CustomPopoverArrowProps = {
  hide?: boolean;
  size?: number;
  offset?: number;
  sx?: SxProps<Theme>;
  placement?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right'
    | 'left-top'
    | 'left-center'
    | 'left-bottom'
    | 'right-top'
    | 'right-center'
    | 'right-bottom';
};

/**
 * Tipo usado por `src/components/custom-popover/styles.tsx`
 * descreve as props esperadas pelo elemento da seta.
 */
export type PopoverArrow = {
  placement?: CustomPopoverArrowProps['placement'];
  offset?: number;
  size?: number;
  theme?: Theme;
};

// Garante compatibilidade com possíveis shapes de `slotProps`
export type CustomPopoverSlotProps = (PopoverProps['slotProps'] extends object
  ? PopoverProps['slotProps']
  : Record<string, any>) & {
  arrow?: CustomPopoverArrowProps;
};

export type UsePopoverReturn = {
  open: PopoverProps['open'];
  anchorEl: PopoverProps['anchorEl'];
  onClose: () => void;
  onOpen: (event: MouseEvent<HTMLElement>) => void;
  setAnchorEl: Dispatch<SetStateAction<PopoverProps['anchorEl']>>;
};

export type CustomPopoverProps = Omit<PopoverProps, 'slotProps'> & {
  slotProps?: CustomPopoverSlotProps;
};
