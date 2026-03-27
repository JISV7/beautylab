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
    <div className="flex h-screen palette-background text-p-font">
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
        <h2 className="text-3xl font-bold text-primary">Invoices</h2>
        <button className="theme-button theme-button-primary">
          + Create New
        </button>
      </div>

      <div className="palette-surface rounded-lg shadow-sm palette-border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="palette-surface border-b palette-border text-p-color text-sm uppercase tracking-wider opacity-75">
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
                className="border-b palette-border hover:palette-primary cursor-pointer transition-colors opacity-75 hover:opacity-100"
              >
                <td className="p-4 font-medium text-p-color">{inv.id}</td>
                <td className="p-4 text-p-color opacity-75">{inv.client.name}</td>
                <td className="p-4 text-p-color opacity-60 text-sm">{inv.date}</td>
                <td className="p-4 text-right font-medium text-p-color">{inv.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Paginación */}
        <div className="p-4 flex items-center justify-between border-t palette-border palette-background">
          <span className="text-sm text-p-color opacity-75">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, invoices.length)} of {invoices.length}
          </span>
          <div className="flex gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="theme-button theme-button-secondary disabled:opacity-50"
            >
              Prev
            </button>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="theme-button theme-button-secondary disabled:opacity-50"
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
          className="text-p-color hover:text-primary font-medium flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoices
        </button>
        <button
          onClick={handlePrint}
          className="theme-button theme-button-primary"
        >
          <Printer className="w-5 h-5" />
          Print Invoice
        </button>
      </div>

      {/* Contenedor de la Factura (Diseño basado en tu imagen) */}
      <div className="palette-surface p-10 rounded-lg shadow-sm palette-border print:shadow-none print:border-none print:p-0">

        {/* Cabecera */}
        <div className="flex justify-between items-start mb-8 border-b pb-6 palette-border">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-h1-color mb-4">FACTURA</h1>
            <p className="text-sm text-p-color font-semibold">FECHA DE EMISIÓN</p>
            <p className="text-md text-p-color">{invoice.date}, {invoice.time}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-medium text-p-color mb-2">{invoice.id}</h2>
            <p className="text-sm text-p-color opacity-75">Nro. de Control: {invoice.controlNo}</p>
            <p className="text-sm text-p-color opacity-75">Total de Nros. de Control: Desde Nro.</p>
            <p className="text-sm text-p-color opacity-75">00-01000001 Hasta Nro. 00-01500000</p>
          </div>
        </div>

        {/* Info Emisor y Cliente */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-h3-color text-lg">codyn</h3>
            <p className="text-sm text-p-color mt-1">R.I.F.: J-12345678-0</p>
            <p className="text-sm text-p-color mt-1">Dirección Fiscal: Codyn Tower, 1er Piso,</p>
            <p className="text-sm text-p-color">Distrito Tecnológico, Caracas, Miranda</p>
          </div>
          <div>
            <h3 className="font-bold text-h3-color text-lg">{invoice.client.name}</h3>
            <p className="text-sm text-p-color mt-1">R.I.F.: {invoice.client.rif}</p>
            <p className="text-sm text-p-color mt-1 w-3/4">Dirección Fiscal: {invoice.client.address}</p>
          </div>
        </div>

        {/* Tabla de Artículos */}
        <table className="w-full text-left mb-8">
          <thead>
            <tr className="palette-surface text-p-color uppercase text-sm opacity-75">
              <th className="py-2 px-3 font-semibold w-12">Nro.</th>
              <th className="py-2 px-3 font-semibold">DESCRIPCIÓN</th>
              <th className="py-2 px-3 font-semibold text-center">CANTIDAD</th>
              <th className="py-2 px-3 font-semibold text-right">PRECIO UNITARIO</th>
              <th className="py-2 px-3 font-semibold text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={item.id} className="border-b palette-border last:border-0">
                <td className="py-4 px-3 text-p-color opacity-75">{index + 1}.</td>
                <td className="py-4 px-3 text-p-color pr-10">{item.desc}</td>
                <td className="py-4 px-3 text-p-color opacity-75 text-center">@ {item.qty}</td>
                <td className="py-4 px-3 text-p-color opacity-75 text-right">@ {item.price}</td>
                <td className="py-4 px-3 text-p-color text-right font-medium">{item.total}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totales */}
        <div className="flex justify-end border-t palette-border pt-4 mb-8">
          <div className="w-80 space-y-2">
            <div className="flex justify-between text-p-color opacity-75">
              <span>BASE IMPONIBLE (ALÍCUOTA 8%)</span>
              <span>{invoice.taxableBase}</span>
            </div>
            <div className="flex justify-between text-p-color opacity-75">
              <span>EXENTO/EXONERADO</span>
              <span>{invoice.exempt}</span>
            </div>
            <div className="flex justify-between text-p-color opacity-75">
              <span>IMPUESTO 8%</span>
              <span>{invoice.tax}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-p-color pt-3 border-t palette-border mt-3">
              <span>TOTAL A PAGAR</span>
              <span>{invoice.total}</span>
            </div>
          </div>
        </div>

        {/* Footer (Método de Pago e Imprenta) */}
        <div className="grid grid-cols-2 gap-8 border-t palette-border pt-6">
          <div>
            <p className="text-p-color text-sm mb-1 uppercase opacity-75">MÉTODO DE PAGO</p>
            <p className="font-medium text-p-color">{invoice.paymentMethod}</p>
            <p className="text-p-color text-sm mt-3 mb-1 uppercase opacity-75">FECHA DE PAGO</p>
            <p className="font-medium text-p-color">{invoice.paymentDate}</p>
          </div>
          <div>
            <p className="text-p-color text-sm mb-1 uppercase opacity-75">IMPRESORA DIGITAL AUTORIZADA</p>
            <p className="font-medium text-p-color">Imprentos C.A.</p>
            <p className="text-sm text-p-color opacity-75">R.I.F.: J-00123456-7</p>
            <p className="text-sm text-p-color opacity-75">Providencia Administrativa Nro. SNAT/2023/001234</p>
            <p className="text-sm text-p-color opacity-75">Fecha de Asignación: 15012023</p>
          </div>
        </div>

      </div>
    </div>
  );
}
