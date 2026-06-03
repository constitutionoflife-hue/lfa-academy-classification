const fs = require('fs');
const path = require('path');

const targetPath = path.join(process.cwd(), 'src', 'AdminReviewDossier.tsx');
let content = fs.readFileSync(targetPath, 'utf8');

const oldTableStart = `<table className="w-full text-right" dir="rtl">
                                              <thead className="bg-gray-50 text-gray-500 text-xs font-bold border-b border-gray-200">
                                                <tr>
                                                  <th className="py-2 px-3 w-10 text-center">
                                                    الحالة
                                                  </th>
                                                  <th className="py-2 px-3">
                                                    المتطلب
                                                  </th>
                                                  <th className="py-2 px-3">
                                                    الإجابة / القيمة
                                                  </th>
                                                  <th className="py-2 px-3 text-center">
                                                    المرفقات
                                                  </th>
                                                  <th className="py-2 px-3 text-center w-32">
                                                    قرار الإدارة
                                                  </th>
                                                  <th className="py-2 px-3 w-48">
                                                    ملاحظات خاصة
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody>`;

const newDivStart = `<div className="flex flex-col w-full">`;

content = content.replace(oldTableStart, newDivStart);
content = content.replace(/<\/tbody>\s*<\/table>/g, '</div>');

// Now we replace the `return ( <tr` block
const trStartStr = `return (
                                                  <tr
                                                    key={k}
                                                    className={\`border-b border-gray-100 transition-colors \${itemStatus === "approved" ? "bg-green-50/20" : itemStatus === "declined" ? "bg-red-50/20" : "hover:bg-gray-50"}\`}
                                                  >`;

const newTrStartStr = `return (
                                                  <div
                                                    key={k}
                                                    className={\`py-4 md:py-5 px-4 md:px-5 border-b border-[#E5DED0] last:border-0 flex flex-col md:flex-row gap-4 md:gap-6 justify-between items-start transition-all \${itemStatus === "approved" ? "bg-green-50/40" : itemStatus === "declined" ? "bg-red-50/40" : "hover:bg-[#F6F1E7]/30"}\`}
                                                  >
                                                    <div className="flex-1 flex flex-col gap-2">
                                                      <p className="font-bold text-[#022C22] text-sm leading-relaxed">{title}</p>
                                                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#64748B]">
                                                        {answerBadge}
                                                      </div>
                                                    </div>
                                                    
                                                    <div className="w-full md:w-auto shrink-0 flex flex-col items-end gap-3 min-w-[260px]">
                                                      <div className="flex items-center justify-end w-full">
                                                        {fileBtn}
                                                      </div>
                                                      
                                                      <div className="flex flex-col gap-2 w-full pt-3 mt-1 border-t border-[#E5DED0]/50">
                                                        <div className="flex items-center justify-between">
                                                          <span className="text-xs font-bold text-gray-400">قرار الإدارة:</span>
                                                          <div className="flex items-center gap-1">`;

const trMidStr = `                                                        <button
                                                          onClick={() =>`;

content = content.replace(
  /<td className="py-3 px-3 text-center">\s*\{statusIcon\}\s*<\/td>\s*<td className="py-3 px-3 text-gray-800 font-bold text-xs leading-relaxed">\s*\{title\}\s*<\/td>\s*<td className="py-3 px-3">\s*\{answerBadge\}\s*<\/td>\s*<td className="py-3 px-3 text-center">\s*\{fileBtn\}\s*<\/td>\s*<td className="py-3 px-3 text-center">\s*<div className="flex items-center justify-center gap-1">\s*<button/gm, 
  newTrStartStr + '<button'
);

const tdInputStr = `                                                        </div>
                                                      </td>
                                                      <td className="py-3 px-3">
                                                        <input`;
const newDivInputStr = `                                                          </div>
                                                        </div>
                                                        <input`;
content = content.replace(tdInputStr, newDivInputStr);

const trEndStr = `                                                        />
                                                      </td>
                                                    </tr>`;
const newDivEndStr = `                                                        />
                                                      </div>
                                                    </div>
                                                  </div>`;
content = content.replace(trEndStr, newDivEndStr);

// Let's improve the fileBtn styling which currently looks like a generic HTML button snippet
const oldFileBtnStr = `className="inline-flex w-fit mx-auto items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-2 py-1 rounded text-xs font-bold transition-colors whitespace-nowrap"`;
const newFileBtnStr = `className="inline-flex w-fit items-center gap-1.5 bg-white border border-[#E5DED0] hover:border-[#064E3B] text-[#064E3B] px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shadow-sm"`;
content = content.replace(oldFileBtnStr, newFileBtnStr);

fs.writeFileSync(targetPath, content);
console.log("Successfully rebuilt the applicant-like UI for admin rows!");
