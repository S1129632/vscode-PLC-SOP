const form = document.querySelector("#sop-form");
const preview = document.querySelector("#document-preview");
const placeholder = document.querySelector("#preview-placeholder");
const exportButton = document.querySelector("#export-button");
const exportWordButton = document.querySelector("#export-word-button");
const loadExampleButton = document.querySelector("#load-example-button");
const formStatus = document.querySelector("#form-status");
const requiredFields = ["title", "author", "revision", "date"];
let previewGenerated = false;

function getLocalDateInputValue() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadExample() {
  const example = {
    title: "Example SOP: Going Online with a ControlLogix 5570/5560 via Ethernet",
    author: "EXAMPLE - replace with authorised author",
    revision: "0",
    date: getLocalDateInputValue(),
    purpose:
      "Provide a controlled example for connecting an authorised engineering workstation to a ControlLogix 5570/5560 controller over an approved Ethernet path and viewing its online status. This draft does not authorise changes to the controller or process.",
    audience:
      "Authorised controls or maintenance engineers who have site-specific permission, training, and approval for the work.",
    mustHave:
      "Approved work authorisation and change control; task-specific risk assessment and required site safety controls; coordination with the control-room/operator; an approved engineering workstation with the correct Studio 5000 Logix Designer version; and the asset's verified communication path from current site-controlled records. Stop if any prerequisite is missing.",
    summary:
      "1. Obtain site approval and confirm the process is in a suitable state.\n2. Verify the controller, workstation, software version, and approved Ethernet path from authorised records.\n3. Connect only through the approved network and identify the intended controller.\n4. Go online only after confirming the controller identity and project details.\n5. Observe status without editing, downloading, forcing, or changing controller mode.\n6. Go offline, close the session, and record the outcome or escalate any mismatch.",
    procedure:
      "1. Confirm the work is authorised under the site's permit, change-control, and operational coordination processes. Review the task-specific risk assessment and required safety controls. Do not proceed if connection could disrupt the process or if the operator/control-room approval is absent.\n2. Confirm from current site-controlled records the asset identifier, controller family/model, approved engineering workstation, Studio 5000 Logix Designer version, and authorised network route. This illustrative example is scoped to ControlLogix 5570/5560; other controller families and software versions require their applicable instructions.\n3. Connect the approved workstation only to the designated Ethernet port/network specified by the site. Use the approved addressing and communication path as provided; do not scan networks, guess addresses, alter IP/network settings, bypass security controls, or connect through guest/public networks.\n4. Start the approved Studio 5000 Logix Designer version. Open the authorised project if available and use its communication-path controls or the site's documented method to select the target. Check the displayed controller identity and path against the asset record before proceeding. If the identity is uncertain, stop and disconnect using the site's process.\n5. Select the software's Go Online action only after the target is positively identified. Review any connection or project comparison prompts. Do not choose Upload or Download as part of this example. If the project is missing, mismatched, or the prompt is unclear, cancel and consult the responsible controls engineer; do not resolve the mismatch by changing the controller or project.\n6. Once online, verify the displayed controller identity and connection status. Observe only what is required for the approved task. Do not edit logic or tag values, download a project, change controller mode, force or toggle I/O, inhibit devices, or make other changes under this procedure.\n7. When finished, use the approved software action to go offline, close the project/session, and disconnect the workstation if required by site procedure. Record the asset, date/time, purpose, observed status, and any warnings in the site's approved record. Report unexpected behaviour or discrepancies immediately and follow site escalation procedures.",
    changeSummary: "Initial illustrative draft; requires site and technical review."
  };

  form.reset();
  for (const [name, value] of Object.entries(example)) {
    form.elements.namedItem(name).value = value;
  }

  validateRequiredFields();
  if (previewGenerated) {
    updateGeneratedPreview();
    return;
  }

  formStatus.textContent = "Example loaded. Review and replace all example details before generating or approving the SOP.";
  formStatus.classList.remove("error");
}

function getFieldValue(name) {
  return String(new FormData(form).get(name) ?? "");
}

function validateRequiredFields() {
  const missingFields = [];

  for (const name of requiredFields) {
    const field = form.elements.namedItem(name);
    const isMissing = getFieldValue(name).trim() === "";
    const error = document.querySelector(`#${name}-error`);

    field.setAttribute("aria-invalid", String(isMissing));
    error.textContent = isMissing ? "This field is required." : "";

    if (isMissing) {
      missingFields.push(field.labels[0].textContent.replace("*", "").trim());
    }
  }

  return missingFields;
}

function renderPreview() {
  for (const output of preview.querySelectorAll("[data-output]")) {
    if (output.dataset.output === "procedure") {
      output.replaceChildren();

      for (const line of getFieldValue("procedure").split(/\r?\n/)) {
        if (line.trim() === "") continue;

        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.className = "template-value procedure-value";
        cell.textContent = line;
        row.append(cell);
        output.append(row);
      }

      continue;
    }

    output.textContent = getFieldValue(output.dataset.output);
  }
}

function updateGeneratedPreview() {
  if (!previewGenerated) return;

  const missingFields = validateRequiredFields();
  if (missingFields.length > 0) {
    preview.hidden = true;
    placeholder.hidden = false;
    exportButton.disabled = true;
    exportWordButton.disabled = true;
    formStatus.textContent = `Complete the required fields to restore the preview: ${missingFields.join(", ")}.`;
    formStatus.classList.add("error");
    return;
  }

  renderPreview();
  preview.hidden = false;
  placeholder.hidden = true;
  exportButton.disabled = false;
  exportWordButton.disabled = false;
  formStatus.textContent = "Preview updated. Changes to the form will update it automatically.";
  formStatus.classList.remove("error");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const missingFields = validateRequiredFields();

  if (missingFields.length > 0) {
    previewGenerated = false;
    preview.hidden = true;
    placeholder.hidden = false;
    exportButton.disabled = true;
    exportWordButton.disabled = true;
    formStatus.textContent = `Complete the required fields before generating a preview: ${missingFields.join(", ")}.`;
    formStatus.classList.add("error");
    form.elements.namedItem(requiredFields.find((name) => getFieldValue(name).trim() === "")).focus();
    return;
  }

  previewGenerated = true;
  renderPreview();
  preview.hidden = false;
  placeholder.hidden = true;
  exportButton.disabled = false;
  exportWordButton.disabled = false;
  formStatus.textContent = "Preview generated. Changes to the form will update it automatically.";
  formStatus.classList.remove("error");
});

form.addEventListener("input", updateGeneratedPreview);
form.addEventListener("change", updateGeneratedPreview);
loadExampleButton.addEventListener("click", loadExample);

exportButton.addEventListener("click", () => {
  if (!previewGenerated || exportButton.disabled) return;
  window.print();
});

exportWordButton.addEventListener("click", async () => {
  if (!previewGenerated || exportWordButton.disabled) return;

  try {
    await window.exportSopAsWord(form);
    formStatus.textContent = "Word document downloaded. Review its page breaks and content before approval.";
    formStatus.classList.remove("error");
  } catch (error) {
    formStatus.textContent = `Word export failed: ${error.message}`;
    formStatus.classList.add("error");
  }
});
