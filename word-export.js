(() => {
  const wordNamespace = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  const relationshipNamespace = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
  const tableWidth = 10000;
  const encoder = new TextEncoder();

  function xmlEscape(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function run(text, options = {}) {
    const properties = [
      '<w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/>',
      options.bold ? "<w:b/>" : "",
      options.size ? `<w:sz w:val="${options.size}"/>` : "",
      options.color ? `<w:color w:val="${options.color}"/>` : ""
    ].join("");
    const lines = String(text ?? "").split(/\r?\n/);
    const content = lines.map((line, index) =>
      `${index > 0 ? "<w:br/>" : ""}<w:t xml:space="preserve">${xmlEscape(line)}</w:t>`
    ).join("");

    return `<w:r><w:rPr>${properties}</w:rPr>${content}</w:r>`;
  }

  function paragraph(text, options = {}) {
    const spacing = options.after ?? 0;
    const alignment = options.align ? `<w:jc w:val="${options.align}"/>` : "";
    return `<w:p><w:pPr><w:spacing w:after="${spacing}" w:line="240" w:lineRule="auto"/>${alignment}</w:pPr>${run(text, options)}</w:p>`;
  }

  function cellXml(cell, width) {
    const span = cell.span ? `<w:gridSpan w:val="${cell.span}"/>` : "";
    const shading = cell.shading
      ? `<w:shd w:val="clear" w:color="auto" w:fill="${cell.shading}"/>`
      : "";
    const content = cell.paragraphXml || paragraph(cell.text, {
      bold: cell.bold,
      size: cell.size ?? 18,
      align: cell.align
    });

    return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${span}${shading}<w:tcMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tcMar><w:vAlign w:val="top"/></w:tcPr>${content}</w:tc>`;
  }

  function tableXml(rows, widths) {
    const columns = widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("");
    const border = '<w:tblBorders><w:top w:val="single" w:sz="8" w:color="777777"/><w:left w:val="single" w:sz="8" w:color="777777"/><w:bottom w:val="single" w:sz="8" w:color="777777"/><w:right w:val="single" w:sz="8" w:color="777777"/><w:insideH w:val="single" w:sz="8" w:color="777777"/><w:insideV w:val="single" w:sz="8" w:color="777777"/></w:tblBorders>';
    const tableProperties = `<w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/>${border}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="90" w:type="dxa"/><w:left w:w="110" w:type="dxa"/><w:bottom w:w="90" w:type="dxa"/><w:right w:w="110" w:type="dxa"/></w:tblCellMar></w:tblPr>`;
    const body = rows.map((row) => {
      let column = 0;
      const cells = row.cells.map((cell) => {
        const span = cell.span || 1;
        const width = widths.slice(column, column + span).reduce((sum, item) => sum + item, 0);
        column += span;
        return cellXml(cell, width);
      }).join("");
      const header = row.header ? "<w:tblHeader/>" : "";
      return `<w:tr><w:trPr><w:cantSplit/>${header}</w:trPr>${cells}</w:tr>`;
    }).join("");

    return `<w:tbl>${tableProperties}<w:tblGrid>${columns}</w:tblGrid>${body}</w:tbl>`;
  }

  function spacer() {
    return '<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>';
  }

  function pageField(instruction) {
    return `<w:fldSimple w:instr=" ${instruction} "><w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="14"/></w:rPr><w:t>1</w:t></w:r></w:fldSimple>`;
  }

  function headerXml(title) {
    const drawing = '<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1143000" cy="460000"/><wp:docPr id="1" name="Severn Trent Water logo"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="severn-trent-logo.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdLogo"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1143000" cy="460000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>';
    const logoCell = `<w:tc><w:tcPr><w:tcW w:w="3500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr><w:p><w:pPr><w:spacing w:after="0"/></w:pPr>${drawing}</w:p></w:tc>`;
    const titleCell = `<w:tc><w:tcPr><w:tcW w:w="6500" w:type="dxa"/><w:vAlign w:val="center"/></w:tcPr>${paragraph("Standard Operating Procedure (SOP)", { bold: true, size: 18, align: "right" })}${paragraph(title, { bold: true, size: 15, align: "right" })}</w:tc>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:hdr xmlns:w="${wordNamespace}" xmlns:r="${relationshipNamespace}" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/><w:tblBorders><w:bottom w:val="single" w:sz="8" w:color="777777"/></w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="3500"/><w:gridCol w:w="6500"/></w:tblGrid><w:tr><w:trPr><w:cantSplit/></w:trPr>${logoCell}${titleCell}</w:tr></w:tbl><w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p></w:hdr>`;
  }

  function footerXml(values) {
    const footerBorder = '<w:tblBorders><w:top w:val="single" w:sz="8" w:color="777777"/><w:bottom w:val="nil"/><w:left w:val="nil"/><w:right w:val="nil"/><w:insideH w:val="nil"/><w:insideV w:val="nil"/></w:tblBorders>';
    const widths = [4200, 3300, 2500];
    const pageNumber = `<w:p><w:pPr><w:spacing w:after="0" w:line="240" w:lineRule="auto"/><w:jc w:val="right"/></w:pPr>${run("Page ", { size: 14 })}${pageField("PAGE")}${run(" of ", { size: 14 })}${pageField("NUMPAGES")}</w:p>`;
    const firstRow = [
      values.title,
      `Owner: ${values.ownerName}`,
      { paragraphXml: pageNumber }
    ];
    const secondRow = [
      `Version No. ${values.revision}`,
      `Next Review Date: ${values.nextReview}`,
      `Published on: ${values.date}`
    ];
    const rowXml = (cells) => `<w:tr><w:trPr><w:cantSplit/></w:trPr>${cells.map((content, index) =>
      `<w:tc><w:tcPr><w:tcW w:w="${widths[index]}" w:type="dxa"/><w:tcMar><w:top w:w="55" w:type="dxa"/><w:left w:w="60" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="60" w:type="dxa"/></w:tcMar><w:vAlign w:val="top"/></w:tcPr>${content.paragraphXml || paragraph(content, { size: 14, bold: index === 0, align: index === 2 ? "right" : undefined })}</w:tc>`
    ).join("")}</w:tr>`;

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="${wordNamespace}"><w:tbl><w:tblPr><w:tblW w:w="${tableWidth}" w:type="dxa"/>${footerBorder}<w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join("")}</w:tblGrid>${rowXml(firstRow)}${rowXml(secondRow)}</w:tbl><w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p></w:ftr>`;
  }

  function documentXml(values) {
    const section = (name, value) => ({
      cells: [{ text: name, bold: true, shading: "F1F1F1" }, { text: value }]
    });
    const steps = values.procedure.split(/\r?\n/).filter((line) => line.trim() !== "");
    const body = [
      tableXml([
        { cells: [{ text: "Title", bold: true, shading: "F1F1F1" }, { text: values.title }] },
        { cells: [{ text: "Connection method", bold: true, shading: "F1F1F1" }, { text: "Ethernet" }] }
      ], [3400, 6600]),
      spacer(),
      tableXml([
        { header: true, cells: [{ text: "Purpose", bold: true, shading: "F1F1F1" }, { text: "Who", bold: true, shading: "F1F1F1" }] },
        { cells: [{ text: values.purpose }, { text: values.audience }] }
      ], [5000, 5000]),
      spacer(),
      tableXml([
        { cells: [{ text: "Must Have (H&S, Quality, Quantity, Environment, Training, Resources)", bold: true, shading: "F1F1F1", span: 1 }] },
        { cells: [{ text: values.mustHave }] }
      ], [tableWidth]),
      spacer(),
      paragraph("Remember – ‘Stop, Think, Take 20’", { bold: true, size: 16, align: "center", after: 100 }),
      tableXml([
        { cells: [{ text: "Summary Must Do’s", bold: true, shading: "F1F1F1" }] },
        { cells: [{ text: values.summary }] }
      ], [tableWidth]),
      spacer(),
      tableXml([
        { header: true, cells: [{ text: "Procedure", bold: true, shading: "F1F1F1" }] },
        ...steps.map((text) => ({ cells: [{ text }] }))
      ], [tableWidth]),
      spacer(),
      tableXml([
        { cells: [{ text: "Document Control & Governance:", bold: true, shading: "F1F1F1", span: 2 }] },
        section("Document Owner Name", values.ownerName),
        section("Document Owner Role", values.ownerRole),
        section("Date of Next Review", values.nextReview),
        section("Version Number", values.revision),
        section("Date", values.date),
        section("Author", values.author),
        section("Waterpedia Reference", values.waterpediaReference),
        section("Reference Document(s)", values.reference)
      ], [3400, 6600]),
      spacer(),
      tableXml([
        { cells: [{ text: "Revision History", bold: true, shading: "F1F1F1", span: 4 }] },
        { header: true, cells: [
          { text: "Version", bold: true, shading: "F1F1F1" },
          { text: "Date Reviewed", bold: true, shading: "F1F1F1" },
          { text: "Summary of Changes", bold: true, shading: "F1F1F1" },
          { text: "Reviewed by", bold: true, shading: "F1F1F1" }
        ] },
        { cells: [
          { text: values.revision },
          { text: values.reviewDate },
          { text: values.changeSummary },
          { text: values.reviewedBy }
        ] }
      ], [1200, 1900, 4300, 2600]),
      spacer(),
      tableXml([
        { cells: [{ text: "The only valid version of this Standard Operating Procedure (SOP) is the electronic version held in Waterpedia. If printed, it is uncontrolled. Ensure the printed version matches the Revision History details in Waterpedia. If not, ‘DO NOT USE’ and contact your line manager for the new version." }] }
      ], [tableWidth]),
      spacer(),
      paragraph("DRAFT — Requires engineer review and company approval before use. Technical content and reference compliance have not been independently verified by this application.", { bold: true, size: 15, after: 0 })
    ].join("");
    const sectionProperties = '<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1750" w:right="907" w:bottom="1600" w:left="907" w:header="360" w:footer="360" w:gutter="0"/><w:cols w:space="720"/></w:sectPr>';

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${wordNamespace}" xmlns:r="${relationshipNamespace}"><w:body>${body}${sectionProperties}</w:body></w:document>`;
  }

  function stylesXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="${wordNamespace}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="18"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="80" w:line="240" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="18"/></w:rPr></w:style></w:styles>`;
  }

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (const byte of bytes) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  const crcTable = new Uint32Array(256);
  for (let index = 0; index < crcTable.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
    }
    crcTable[index] = value >>> 0;
  }

  function concatenate(chunks) {
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }

  function zipFiles(files) {
    const localParts = [];
    const centralParts = [];
    let localOffset = 0;
    const now = new Date();
    const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
    const dosDate = ((Math.max(now.getFullYear(), 1980) - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

    for (const file of files) {
      const name = encoder.encode(file.name);
      const data = typeof file.data === "string" ? encoder.encode(file.data) : file.data;
      const checksum = crc32(data);
      const localHeader = new Uint8Array(30);
      const localView = new DataView(localHeader.buffer);
      localView.setUint32(0, 0x04034b50, true);
      localView.setUint16(4, 20, true);
      localView.setUint16(6, 0x0800, true);
      localView.setUint16(8, 0, true);
      localView.setUint16(10, dosTime, true);
      localView.setUint16(12, dosDate, true);
      localView.setUint32(14, checksum, true);
      localView.setUint32(18, data.length, true);
      localView.setUint32(22, data.length, true);
      localView.setUint16(26, name.length, true);
      localView.setUint16(28, 0, true);
      localParts.push(localHeader, name, data);

      const centralHeader = new Uint8Array(46);
      const centralView = new DataView(centralHeader.buffer);
      centralView.setUint32(0, 0x02014b50, true);
      centralView.setUint16(4, 20, true);
      centralView.setUint16(6, 20, true);
      centralView.setUint16(8, 0x0800, true);
      centralView.setUint16(10, 0, true);
      centralView.setUint16(12, dosTime, true);
      centralView.setUint16(14, dosDate, true);
      centralView.setUint32(16, checksum, true);
      centralView.setUint32(20, data.length, true);
      centralView.setUint32(24, data.length, true);
      centralView.setUint16(28, name.length, true);
      centralView.setUint16(30, 0, true);
      centralView.setUint16(32, 0, true);
      centralView.setUint16(34, 0, true);
      centralView.setUint16(36, 0, true);
      centralView.setUint32(38, 0, true);
      centralView.setUint32(42, localOffset, true);
      centralParts.push(centralHeader, name);
      localOffset += localHeader.length + name.length + data.length;
    }

    const centralDirectory = concatenate(centralParts);
    const end = new Uint8Array(22);
    const endView = new DataView(end.buffer);
    endView.setUint32(0, 0x06054b50, true);
    endView.setUint16(4, 0, true);
    endView.setUint16(6, 0, true);
    endView.setUint16(8, files.length, true);
    endView.setUint16(10, files.length, true);
    endView.setUint32(12, centralDirectory.length, true);
    endView.setUint32(16, localOffset, true);
    endView.setUint16(20, 0, true);
    return concatenate([...localParts, centralDirectory, end]);
  }

  function logoBytes() {
    const image = document.querySelector("#document-preview .document-logo");
    if (!image || !image.complete || image.naturalWidth === 0) {
      throw new Error("The document logo could not be loaded.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("The browser could not prepare the document logo.");
    }

    context.drawImage(image, 0, 0);
    const base64 = canvas.toDataURL("image/png").split(",")[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function fieldValues(form) {
    const formData = new FormData(form);
    const value = (name) => String(formData.get(name) ?? "");
    return {
      title: value("title"),
      author: value("author"),
      revision: value("revision"),
      date: value("date"),
      purpose: value("purpose"),
      audience: value("audience"),
      mustHave: value("mustHave"),
      summary: value("summary"),
      procedure: value("procedure"),
      ownerName: value("ownerName"),
      ownerRole: value("ownerRole"),
      nextReview: value("nextReview"),
      waterpediaReference: value("waterpediaReference"),
      reference: value("reference"),
      reviewDate: value("reviewDate"),
      reviewedBy: value("reviewedBy"),
      changeSummary: value("changeSummary")
    };
  }

  function safeFileName(title) {
    const safeTitle = title.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").replace(/\s+/g, " ").slice(0, 100);
    return `${safeTitle || "PLC-SOP"}.docx`;
  }

  window.exportSopAsWord = async function (form) {
    const values = fieldValues(form);
    const packageFiles = [
      {
        name: "[Content_Types].xml",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/header1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.header+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>'
      },
      {
        name: "_rels/.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdOfficeDocument" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'
      },
      {
        name: "word/document.xml",
        data: documentXml(values)
      },
      {
        name: "word/_rels/document.xml.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdHeader" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/header" Target="header1.xml"/><Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rIdSettings" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/></Relationships>'
      },
      {
        name: "word/styles.xml",
        data: stylesXml()
      },
      {
        name: "word/settings.xml",
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="${wordNamespace}"><w:updateFields w:val="true"/></w:settings>`
      },
      {
        name: "word/header1.xml",
        data: headerXml(values.title)
      },
      {
        name: "word/_rels/header1.xml.rels",
        data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdLogo" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/logo.png"/></Relationships>'
      },
      {
        name: "word/footer1.xml",
        data: footerXml(values)
      },
      {
        name: "word/media/logo.png",
        data: logoBytes()
      }
    ];
    const archive = zipFiles(packageFiles);
    const blob = new Blob([archive], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = safeFileName(values.title);
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
})();
