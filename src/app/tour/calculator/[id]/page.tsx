// src/app/tour/calculator/[id]/page.tsx
export default function Page({ params }: { params: { id: string } }) {
  return <div>Calculator for {params.id}</div>;
}
