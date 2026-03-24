import { useState } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';

// --- DATOS DE PRUEBA (MOCK DATA) ---
const mockInvoices = Array.from({ length: 12 }).map((_, i) => ({
  id: `INV 001-0000021${4 + i}`,
  controlNo: `00-0123456${7 + i}`,
  date: '26102023',
  time: '10:15:30 A.M.',
  client: {
    name: i % 2 === 0 ? 'Apex Solutions' : 'Tech Corp C.A.',
    rif: `J-98765432-${i % 9}`,
    address: 'Calle 1, Edif. Profesional, Piso 2, Carabobo'
  },
  items: [
    { id: 1, desc: 'Fundamentals of AI and Machine Learning - 2-Day Workshop', qty: 2, price: '$1,299.00', total: 'Bs. 2,598.00' },
    { id: 2, desc: 'Natural Language Processing: From Theory to Application', qty: 3, price: '$99.99', total: '$299.97' },
    { id: 3, desc: 'Computer Vision Techniques for Real-World Problems', qty: 10, price: '$12.50', total: '$125.00' },
    { id: 4, desc: 'Digital Course Access Fee & Resource Kit', qty: 1, price: '$45.00', total: '$45.00' },
  ],
  taxableBase: 'Bs. 3,067.00',
  exempt: 'Bs. 0.00',
  tax: 'Bs. 24.54',
  total: 'Bs. 3,313.44',
  paymentMethod: 'Bank Transfer',
  paymentDate: '10112023'
}));

// --- COMPONENTE PRINCIPAL ---
export default function InvoicesPage() {
  const [selectedInvoice, setSelectedInvoice] = useState<typeof mockInvoices[0] | null>(null);

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-auto print:p-0 print:overflow-visible">
        {selectedInvoice ? (
          <InvoiceDetail
            invoice={selectedInvoice}
            onBack={() => setSelectedInvoice(null)}
          />
        ) : (
          <InvoiceList
            invoices={mockInvoices}
            onSelect={setSelectedInvoice}
          />
        )}
      </main>
    </div>
  );
}

// --- VISTA DE LISTA CON PAGINACIÓN ---
function InvoiceList({ invoices, onSelect }: { invoices: typeof mockInvoices; onSelect: (inv: typeof mockInvoices[0]) => void }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(invoices.length / itemsPerPage);
  const currentInvoices = invoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-red-500">Invoices</h2>
        <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow transition-colors">
          + Create New
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-4 font-semibold">Invoice #</th>
              <th className="p-4 font-semibold">Client</th>
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {currentInvoices.map((inv) => (
              <tr
                key={inv.id}
                onClick={() => onSelect(inv)}
                className="border-b border-gray-100 hover:bg-red-50 cursor-pointer transition-colors"
              >
                <td className="p-4 font-medium text-gray-800">{inv.id}</td>
                <td className="p-4 text-gray-600">{inv.client.name}</td>
                <td className="p-4 text-gray-500 text-sm">{inv.date}</td>
                <td className="p-4 text-right font-medium text-gray-800">{inv.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="p-4 flex items-center justify-between border-t border-gray-200 bg-gray-50">
          <span className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="px-3 py-1 border border-gray-300 rounded bg-white text-gray-600 disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- VISTA DETALLE Y FORMATO IMPRESIÓN ---
function InvoiceDetail({ invoice, onBack }: { invoice: typeof mockInvoices[0]; onBack: () => void }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Controles superiores (se ocultan al imprimir) */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-red-500 font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoices
        </button>
        <button
          onClick={handlePrint}
          className="bg-gray-800 hover:bg-gray-900 text-white px-5 py-2 rounded-md shadow flex items-center gap-2 transition-colors"
        >
          <Printer className="w-5 h-5" />
          Print Invoice
        </button>
      </div>

      {/* Contenedor de la Factura (Diseño basado en tu imagen) */}
      <div className="bg-white p-10 rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none print:p-0">

        {/* Cabecera */}
        <div className="flex justify-between items-start mb-8 border-b pb-6 border-gray-200">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">FACTURA</h1>
            <p className="text-sm text-gray-600 font-semibold">FECHA DE EMISIÓN</p>
            <p className="text-md text-gray-800">{invoice.date}, {invoice.time}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-medium text-gray-900 mb-2">{invoice.id}</h2>
            <p className="text-sm text-gray-600">Nro. de Control: {invoice.controlNo}</p>
            <p className="text-sm text-gray-600">Total de Nros. de Control: Desde Nro.</p>
            <p className="text-sm text-gray-600">00-01000001 Hasta Nro. 00-01500000</p>
          </div>
        </div>

        {/* Info Emisor y Cliente */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">codyn</h3>
            <p className="text-sm text-gray-700 mt-1">R.I.F.: J-12345678-0</p>
            <p className="text-sm text-gray-700 mt-1">Dirección Fiscal: Codyn Tower, 1er Piso,</p>
            <p className="text-sm text-gray-700">Distrito Tecnológico, Caracas, Miranda</p>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-lg">{invoice.client.name}</h3>
            <p className="text-sm text-gray-700 mt-1">R.I.F.: {invoice.client.rif}</p>
            <p className="text-sm text-gray-700 mt-1 w-3/4">Dirección Fiscal: {invoice.client.address}</p>
          </div>
        </div>

        {/* Tabla de Artículos */}
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="bg-gray-100 text-gray-700 uppercase text-sm">
              <th className="py-2 px-3 font-semibold w-12">Nro.</th>
              <th className="py-2 px-3 font-semibold">DESCRIPCIÓN</th>
              <th className="py-2 px-3 font-semibold text-center">CANTIDAD</th>
              <th className="py-2 px-3 font-semibold text-right">PRECIO UNITARIO</th>
              <th className="py-2 px-3 font-semibold text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="border-b border-gray-100 last:border-0">
                <td className="py-4 px-3 text-gray-700">{index + 1}.</td>
                <td className="py-4 px-3 text-gray-900 pr-10">{item.desc}</td>
                <td className="py-4 px-3 text-gray-700 text-center">@ {item.qty}</td>
                <td className="py-4 px-3 text-gray-700 text-right">@ {item.price}</td>
                <td className="py-4 px-3 text-gray-900 text-right font-medium">{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end border-t border-gray-200 pt-4 mb-8">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-gray-700">
              <span>BASE IMPONIBLE (ALÍCUOTA 8%)</span>
              <span>{invoice.taxableBase}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>EXENTO/EXONERADO</span>
              <span>{invoice.exempt}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>IMPUESTO 8%</span>
              <span>{invoice.tax}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200 mt-3">
              <span>TOTAL A PAGAR</span>
              <span>{invoice.total}</span>
            </div>
          </div>
        </div>

        {/* Footer (Método de Pago e Imprenta) */}
        <div className="grid grid-cols-2 gap-8 border-t border-gray-200 pt-6">
          <div>
            <p className="text-gray-600 text-sm mb-1 uppercase">MÉTODO DE PAGO</p>
            <p className="font-medium text-gray-900">{invoice.paymentMethod}</p>
            <p className="text-gray-600 text-sm mt-3 mb-1 uppercase">FECHA DE PAGO</p>
            <p className="font-medium text-gray-900">{invoice.paymentDate}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm mb-1 uppercase">IMPRESORA DIGITAL AUTORIZADA</p>
            <p className="font-medium text-gray-900">Imprentos C.A.</p>
            <p className="text-sm text-gray-700">R.I.F.: J-00123456-7</p>
            <p className="text-sm text-gray-700">Providencia Administrativa Nro. SNAT/2023/001234</p>
            <p className="text-sm text-gray-700">Fecha de Asignación: 15012023</p>
          </div>
        </div>

      </div>
    </div>
  );
}
