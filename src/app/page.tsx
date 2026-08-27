import SearchBox from "@/components/home/SearchBox";

const STEPS = [
  { icon: "📍", title: "Escribe tu destino", text: "Te mostramos los parqueaderos disponibles cerca." },
  { icon: "⚖️", title: "Compara opciones", text: "Precio, distancia, horario y servicios en un solo lugar." },
  { icon: "✅", title: "Reserva en segundos", text: "Elige cuánto tiempo necesitas y confirma al instante." },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="flex flex-1 flex-col items-center justify-center gap-8 bg-gradient-to-b from-blue-50 to-neutral-50 px-4 py-20 text-center">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl">
            Encuentra parqueadero,
            <br className="hidden sm:block" /> como pedir un Uber.
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-neutral-600">
            Busca, compara y reserva parqueaderos cercanos a tu destino en menos de un minuto.
          </p>
        </div>

        <SearchBox />

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.title} className="w-56 rounded-2xl bg-white p-5 text-left shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <div className="mt-2 font-semibold">{s.title}</div>
              <div className="mt-1 text-sm text-neutral-500">{s.text}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
