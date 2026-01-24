export default function AdminDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Detalhes do Admin</h1>
      <p>ID do Admin: {params.id}</p>
      <p>⚠️ Construção em andamento...</p>
    </div>
  );
}