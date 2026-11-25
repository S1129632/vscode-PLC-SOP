# PLC SOP Generator

A browser-based draft SOP form and live preview following the section structure of the supplied company SOP template.
The template's controlled-copy wording and safety reminder are reproduced as fixed content; the former example's USB procedure content and named personnel are not carried over.
The supplied Severn Trent logo and blue/green brand accents appear in both the webpage header and SOP preview/print layout. SOP document text remains black, matching the example company template.
The SOP preview uses the template's table-based title, Purpose/Who, Must Have, Summary Must Do’s, governance, revision history, and controlled-copy layout rather than application-style cards.
The document header and repeatable print footer follow the supplied template's logo and footer fields; the example's “OFFICIAL SENSITIVE” marking is omitted pending authorised classification.
AI assistance is currently an unavailable, clearly marked workflow placeholder because no Azure AI service is configured. Four supplied Rockwell PDFs were reviewed locally and their title/revision details and coverage notes are prefilled in document control. The app does not load or search their contents at runtime, so it does not perform automated comparison. Original engineer notes are preserved; future AI output must remain a separate suggestion for review.

## Run locally

Open `index.html` in a current desktop browser. No package installation or server is required.

## Use

1. Complete the required document fields: SOP title, author, revision number, and date. PLC family and model are not requested because this procedure is intended to cover Ethernet-connected PLCs generally.
2. Select **Load ControlLogix 5570/5560 Ethernet example** for an illustrative, non-operational draft. It replaces current form values; review every field and adapt it to the actual controller, software version, site controls, and approved work instructions.
3. Enter only reviewed procedure text and other document information.
4. Select **Generate SOP preview**. The preview updates as the form changes.
5. Select **Export Word (.docx)** to download an editable Word document with boxed sections and repeating template header/footer. Review its pagination in Word before approval.
6. Select **Export / Print PDF** and choose the browser's **Save as PDF** destination.

The form preserves entered text and does not create procedure steps or technical specifications. The preview identifies Ethernet as the connection method and does not request a specific PLC family or model. The Word export is an editable Office Open XML document; its boxed tables and repeating header/footer use Word's pagination. Review page breaks and content in Word before approval. Browser print layout is used for PDF export; the SOP header and footer repeat on each page, with page numbering in the print margin. Disable browser-generated print headers and footers to avoid duplicates, then review the PDF for page breaks and content before approval.

## Current limitation

Rockwell Automation document comparison is not implemented. The supplied `1756-UM001Q-EN-P` covers ControlLogix 5570/5560; `1756-RM094-EN-P` covers Logix 5000 design considerations across applicable controller families. `ENET-UM001` states it has been replaced by the supplied `ENET-UM006C-EN-P`. The supplied `1756-PM001` is a one-page Common Procedures manual list that points to `1756-PM019` for Import/Export, while the actual supplied Import/Export manual is `1756-RM014D-EN-P`. `NIST.SP.800-82r3.pdf` provides OT cyber-security guidance. Studio 5000 Logix Designer Online Help is a web-based Rockwell resource and is not downloaded into this workspace. The example input is scoped to the documented ControlLogix 5570/5560 manual and is not a validated work instruction; other controllers, software versions, and site requirements need their own approved procedure. No additional PDF source is currently identified as missing; the procedure still requires engineer and company review.

# vscode-PLC-SOP
