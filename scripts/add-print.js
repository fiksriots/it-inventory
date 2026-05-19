const fs = require('fs');
let poFile = fs.readFileSync('src/app/(app)/po/[id]/po-client-view.tsx', 'utf8');

poFile = poFile.replace('Check, ExternalLink, RefreshCw', 'Check, ExternalLink, RefreshCw, Printer');
poFile = poFile.replace('<div className="flex items-center gap-2">\n          {(canEdit || invoiceFile)', '<div className="flex items-center gap-2 no-print">\n          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-background border border-border text-text-muted hover:text-foreground font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"><Printer className="w-4 h-4" />Cetak PDF</button>\n          {(canEdit || invoiceFile)');
poFile = poFile.replace('{canEdit && <th className="py-3 px-4 text-center font-bold text-[10px] uppercase tracking-wider text-text-muted w-16">Aksi</th>}', '{canEdit && <th className="py-3 px-4 text-center font-bold text-[10px] uppercase tracking-wider text-text-muted w-16 no-print">Aksi</th>}');
poFile = poFile.replace('<td className="py-2.5 px-4 align-middle text-center">', '<td className="py-2.5 px-4 align-middle text-center no-print">');
poFile = poFile.replace('<tr className="border-t border-border/40 bg-background/50 hover:bg-background/80 transition-colors">', '<tr className="border-t border-border/40 bg-background/50 hover:bg-background/80 transition-colors no-print">');
poFile = poFile.replace('<div className="lg:col-span-1 space-y-4">\n            <div className="bg-surface', '<div className="lg:col-span-1 space-y-4 no-print">\n            <div className="bg-surface');

fs.writeFileSync('src/app/(app)/po/[id]/po-client-view.tsx', poFile);

let prjFile = fs.readFileSync('src/app/(app)/projects/[id]/project-detail-client.tsx', 'utf8');
prjFile = prjFile.replace('Globe, Activity', 'Globe, Activity, Printer');
prjFile = prjFile.replace('<div className="flex items-center gap-2">\n          {project.status', '<div className="flex items-center gap-2 no-print">\n          <button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-background border border-border text-text-muted hover:text-foreground font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"><Printer className="w-4 h-4" />Cetak PDF</button>\n          {project.status');
prjFile = prjFile.replace('<div className="lg:col-span-1 space-y-6">\n          <div className="bg-surface', '<div className="lg:col-span-1 space-y-6 no-print">\n          <div className="bg-surface');
fs.writeFileSync('src/app/(app)/projects/[id]/project-detail-client.tsx', prjFile);

let srvFile = fs.readFileSync('src/app/(app)/services/[id]/service-complete-form.tsx', 'utf8');
srvFile = srvFile.replace('Globe, Loader2, Save', 'Globe, Loader2, Save, Printer');
srvFile = srvFile.replace('<button\n            type="button"\n            onClick={() => router.push(\'/services\')}', '<button type="button" onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 bg-surface hover:bg-background border border-border text-text-muted hover:text-foreground font-bold rounded-xl text-xs transition-all active:scale-95 shadow-sm"><Printer className="w-4 h-4" />Cetak PDF</button>\n          <button\n            type="button"\n            onClick={() => router.push(\'/services\')}');
srvFile = srvFile.replace('<div className="flex items-center gap-3">\n          <button', '<div className="flex items-center gap-3 no-print">\n          <button');
fs.writeFileSync('src/app/(app)/services/[id]/service-complete-form.tsx', srvFile);

console.log('done');
