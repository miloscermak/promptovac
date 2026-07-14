// Export výsledků do Excelu
import XLSX from 'xlsx';

export default async (req) => {
  try {
    const { results = [], prompt = '', hasImage = false } = await req.json();
    if (!results.length) {
      return Response.json({ error: 'Žádné výsledky k exportu' }, { status: 400 });
    }

    const rows = results.map((r) => ({
      'Model': r.name || r.model,
      'Provider': r.provider || '',
      'Odpověď č.': r.responseNumber || 1,
      'Čas (s)': r.elapsed ?? '',
      'Odpověď': r.response || r.error || '',
      'Stav': r.error ? (r.skipped ? 'přeskočeno' : 'chyba') : 'ok'
    }));

    const info = [
      { 'Klíč': 'Prompt', 'Hodnota': prompt },
      { 'Klíč': 'Obrázek', 'Hodnota': hasImage ? 'ano' : 'ne' },
      { 'Klíč': 'Vygenerováno', 'Hodnota': new Date().toLocaleString('cs-CZ') }
    ];

    const wb = XLSX.utils.book_new();
    const wsResults = XLSX.utils.json_to_sheet(rows);
    wsResults['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 10 }, { wch: 8 }, { wch: 100 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, wsResults, 'Výsledky');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(info), 'Info');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new Response(buffer, {
      headers: {
        'Content-Disposition': 'attachment; filename="promptovac-vysledky.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
};

export const config = { path: '/api/export-excel' };
