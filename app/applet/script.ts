import fs from 'fs';
const files = fs.readdirSync('src').filter(f => f.startsWith('Classification') && f.endsWith('.tsx')).map(f => 'src/' + f);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const oldContent = content;
    // We are looking for the extra </div> that was left behind
    // Look at lines 465 to 470:
    //               </div>
    //               
    // 
    //               </div>
    //            </div>
    //         </div>
    // We want to remove the middle `</div>`.
    
    // We can confidently remove `\n              </div>\n           </div>\n        </div>\n\n        {/* Bottom Actions */}`
    // and replace with `\n           </div>\n        </div>\n\n        {/* Bottom Actions */}`
    content = content.replace(/\n              <\/div>\n           <\/div>\n        <\/div>\n\n        \{\/\* Bottom Actions \*\/\}/g, '\n           </div>\n        </div>\n\n        {/* Bottom Actions */}');
    
    if (content !== oldContent) {
        console.log('Fixed ' + file);
        fs.writeFileSync(file, content, 'utf8');
    }
});
