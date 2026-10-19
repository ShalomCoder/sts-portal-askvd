/**
 * Declarative registry of the "long tail" STS services.
 *
 * Each service is a form the upstream STS site exposes at `upstreamPath` and
 * submits to `endpoint`. The portal renders a native, styled form from this
 * spec and posts it back through the same-origin proxy
 * (/api/sts/<endpoint>), which injects the session CSRF token.
 *
 * Hidden/prefilled values (student id, name, programme, …) are NOT declared
 * here — they are scraped from the live upstream page by
 * /api/service/[slug] and replayed on submit, exactly like the original form.
 */

export type ServiceFieldType =
  | "text"
  | "email"
  | "tel"
  | "date"
  | "number"
  | "textarea"
  | "select"
  | "checkboxes"
  | "file";

export type ServiceField = {
  name: string;
  label: string;
  type?: ServiceFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: string[];
  /** Render across the full width of the form grid. */
  full?: boolean;
  /** Populate <option>s from a JSON endpoint via the proxy. */
  source?: {
    endpoint: string;
    listKey: string;
    valueKey: string;
    labelKey: string;
    /** Optional extra key appended to the label (e.g. course title). */
    labelExtraKey?: string;
  };
};

export type ServiceLookup = {
  /** Which select's value drives the lookup. */
  paramFrom: string;
  /** Upstream endpoint to POST { [paramKey]: value } to. */
  endpoint: string;
  /** Request param name sent upstream (usually "_token" is added by the proxy). */
  paramKey: string;
  /** Response array key. */
  listKey: string;
  /** Keys used to build <option>. */
  valueKey: string;
  labelKey: string;
  /** Field whose options are populated from the lookup. */
  target: string;
};

export type ServiceSpec = {
  slug: string;
  title: string;
  /** Short line shown on the services hub. */
  summary: string;
  subtitle: string;
  group: string;
  icon: string;
  upstreamPath: string;
  endpoint: string;
  formId?: string;
  multipart?: boolean;
  fields: ServiceField[];
  lookup?: ServiceLookup;
  notes?: string[];
};

export const SERVICES: ServiceSpec[] = [
  /* ------------------------------ registration ---------------------------- */
  {
    slug: "specialisation",
    title: "Course Specialisation",
    summary: "Choose the degree option / major you want to read at Level 200",
    subtitle:
      "Registration for available degree options. Pick your specialisation type and majors.",
    group: "Registration & records",
    icon: "book",
    upstreamPath: "/provide-specialization",
    endpoint: "save-specialization",
    formId: "courseSpecializationForm",
    fields: [
      {
        name: "type",
        label: "Specialisation type",
        type: "select",
        required: true,
      },
      {
        name: "major_one",
        label: "First major",
        type: "select",
        full: true,
      },
      {
        name: "major_two",
        label: "Second major / combined",
        type: "select",
        full: true,
      },
      { name: "minor", label: "Minor", type: "select", full: true },
    ],
    notes: [
      "Available majors update after you choose a specialisation type.",
      "Submitting replaces your previous choice for the academic year.",
    ],
  },
  {
    slug: "deferment",
    title: "Deferment Request",
    summary: "Apply to defer your programme of study",
    subtitle: "Submit a request to defer your studies, with supporting documents.",
    group: "Registration & records",
    icon: "clipboard",
    upstreamPath: "/deferment",
    endpoint: "savedeferment",
    formId: "defermenttask",
    multipart: true,
    fields: [
      {
        name: "phone",
        label: "Phone number",
        type: "tel",
        required: true,
        placeholder: "e.g. 024XXXXXXX",
      },
      {
        name: "level_of_deferment",
        label: "Level to defer",
        type: "select",
        required: true,
      },
      {
        name: "semester_of_deferment",
        label: "Semester",
        type: "select",
        required: true,
      },
      {
        name: "reasons_of_deferment",
        label: "Reasons",
        type: "textarea",
        full: true,
        placeholder: "Explain why you are requesting a deferment",
      },
      {
        name: "documents",
        label: "Supporting document",
        type: "file",
        full: true,
        help: "PDF or image. Attach evidence where relevant.",
      },
    ],
    notes: ["Deferred semesters must be applied for before the deadline."],
  },
  {
    slug: "withdrawal",
    title: "Withdrawal Request",
    summary: "Apply to withdraw from the university and request a refund",
    subtitle:
      "Withdrawal of studentship request. Attach supporting documents and bank details.",
    group: "Registration & records",
    icon: "clipboard",
    upstreamPath: "/requestrefund",
    endpoint: "saverefundrequest",
    formId: "payform",
    multipart: true,
    fields: [
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
      },
      {
        name: "altemail",
        label: "Alternate email",
        type: "email",
        required: true,
      },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "altphone", label: "Alternate phone", type: "tel" },
      {
        name: "purpose",
        label: "Purpose",
        type: "textarea",
        full: true,
        placeholder: "Reason for withdrawal",
      },
      {
        name: "reasons[]",
        label: "Reasons",
        type: "checkboxes",
        full: true,
        options: ["new-school", "Travelling", "Academic", "Financial", "Other"],
      },
      {
        name: "reasonspecify",
        label: "If other, specify",
        full: true,
        placeholder: "Please specify",
      },
      {
        name: "refund_request",
        label: "Request a refund?",
        type: "select",
        options: ["yes", "no"],
        required: true,
      },
      {
        name: "documents",
        label: "Supporting documents",
        type: "file",
        full: true,
      },
      { name: "accname", label: "Account name" },
      { name: "accnumber", label: "Account number" },
      { name: "bankbranch", label: "Bank branch" },
      { name: "bankname", label: "Bank name" },
    ],
  },
  {
    slug: "matriculation",
    title: "Matriculation Registration",
    summary: "Register for matriculation and provide an alternate contact",
    subtitle:
      "Matriculation registration. Provide your contact details and an alternate person.",
    group: "Registration & records",
    icon: "user",
    upstreamPath: "/matriculation",
    endpoint: "savematriculation",
    formId: "matriculationform",
    fields: [
      {
        name: "alternate_email",
        label: "Alternate email",
        type: "email",
        required: true,
      },
      {
        name: "phone",
        label: "Phone",
        type: "tel",
        required: true,
        placeholder: "e.g. 02XXXXXXXX",
      },
      { name: "hall", label: "Hall", type: "select", required: true },
      {
        name: "alt_person",
        label: "Alternate contact name",
        required: true,
        placeholder: "Name of person",
      },
      { name: "alt_relation", label: "Relationship", required: true },
      { name: "alt_email", label: "Alternate contact email", type: "email" },
      {
        name: "alt_phone",
        label: "Alternate contact phone",
        type: "tel",
        required: true,
        placeholder: "e.g. 02XXXXXXXX",
      },
      {
        name: "alt_address",
        label: "Alternate contact address",
        type: "textarea",
        placeholder: "Postal address",
        full: true,
      },
      {
        name: "alt_becontacted",
        label: "Alternate may be contacted",
        type: "select",
        required: true,
      },
    ],
  },
  {
    slug: "cle-lecturer",
    title: "Verify Course & Lecturer",
    summary: "Confirm the lecturer who taught each of your courses",
    subtitle:
      "Verify the courses you registered and the lecturer who taught them.",
    group: "Registration & records",
    icon: "book",
    upstreamPath: "/cle-leturer-select",
    endpoint: "save-cle-lecturer",
    fields: [
      {
        name: "course_code",
        label: "Course",
        type: "select",
        required: true,
        source: {
          endpoint: "/api/courses",
          listKey: "data",
          valueKey: "course_code",
          labelKey: "course_code",
          labelExtraKey: "course_title",
        },
      },
      {
        name: "staff_id",
        label: "Lecturer",
        type: "select",
        required: true,
      },
    ],
    lookup: {
      paramFrom: "course_code",
      endpoint: "get-cle-examiners",
      paramKey: "course_code",
      listKey: "examiners",
      valueKey: "staff_id",
      labelKey: "name",
      target: "staff_id",
    },
  },

  /* ------------------------------ certificates ---------------------------- */
  {
    slug: "certificate",
    title: "Certificate Booking",
    summary: "Book an appointment to collect an academic certificate",
    subtitle:
      "Request an academic certificate and choose a collection date.",
    group: "Certificates & letters",
    icon: "doc",
    upstreamPath: "/request-certificate",
    endpoint: "save-cert-request",
    formId: "certForm",
    fields: [
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "alt_email", label: "Alternate email", type: "email" },
      {
        name: "pickup_date",
        label: "Preferred collection date",
        type: "date",
        full: true,
      },
    ],
  },
  {
    slug: "internship-letter",
    title: "Internship Letter",
    summary: "Request an internship / attachment letter addressed to an organisation",
    subtitle:
      "Generate an internship letter. Provide the recipient and organisation details.",
    group: "Certificates & letters",
    icon: "doc",
    upstreamPath: "/internship-payments",
    endpoint: "generate-internship-letter",
    formId: "letterform",
    fields: [
      {
        name: "payment_reference",
        label: "Payment reference",
        placeholder: "Reference from your internship payment",
      },
      { name: "phone", label: "Phone", type: "tel", required: true },
      {
        name: "recipient_name",
        label: "Recipient name",
        required: true,
      },
      {
        name: "recipient_position",
        label: "Recipient position",
        placeholder: "e.g. Human Resource Manager",
      },
      { name: "org_name", label: "Organisation", required: true, full: true },
      { name: "address", label: "Address", full: true },
      { name: "city", label: "City" },
      { name: "country", label: "Country" },
    ],
    notes: [
      "A payment reference is required if you have already paid the internship fee.",
    ],
  },
  {
    slug: "wes",
    title: "WES Transcript Request",
    summary: "Request a transcript for WES (World Education Services) evaluation",
    subtitle:
      "Submit a WES transcript request. Pay the WES fee, then attach your documents.",
    group: "Certificates & letters",
    icon: "doc",
    upstreamPath: "/wes/home",
    endpoint: "wes/submit",
    formId: "defermenttask",
    multipart: true,
    fields: [
      { name: "altemail", label: "Alternate email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "wes_ref", label: "WES reference number", full: true },
      {
        name: "degree_type[]",
        label: "Degree type",
        type: "checkboxes",
        full: true,
        options: [
          "DIPLOMA",
          "BACHELORS",
          "MSC_MA_MPH",
          "MBA",
          "MPHIL",
          "PHD",
          "LLB",
        ],
      },
      {
        name: "documents",
        label: "Supporting documents",
        type: "file",
        full: true,
      },
    ],
  },

  /* -------------------------------- finance ------------------------------- */
  {
    slug: "refund",
    title: "Request a Refund",
    summary: "Request a refund of fees paid into your student account",
    subtitle: "Refund request. Provide your bank details and the reason.",
    group: "Finance & welfare",
    icon: "wallet",
    upstreamPath: "/refundrequest",
    endpoint: "saverefundrequest",
    formId: "payform",
    fields: [
      { name: "altemail", label: "Alternate email", type: "email" },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "altphone", label: "Alternate phone", type: "tel" },
      { name: "accname", label: "Account name", required: true },
      { name: "accnumber", label: "Account number", required: true },
      { name: "bankbranch", label: "Bank branch", required: true },
      { name: "bankname", label: "Bank name", required: true },
      {
        name: "amount",
        label: "Amount (GHS)",
        type: "number",
        required: true,
      },
      {
        name: "reasons[]",
        label: "Reason",
        type: "checkboxes",
        full: true,
        options: [
          "Scholarship",
          "Overpayment of fees",
          "Withdrawal of studentship",
          "Funds meant for other institutions",
          "Other",
        ],
      },
      {
        name: "reasonspecify",
        label: "If other, specify",
        full: true,
        placeholder: "Please specify",
      },
    ],
    notes: [
      "Refunds are paid back to the bank account you provide, so double-check the details.",
    ],
  },
  {
    slug: "student-loan",
    title: "Student Loan Consent",
    summary: "Give consent for the Student Loan Trust Fund",
    subtitle:
      "Student Loan Trust Fund consent form. Confirm your details and give consent.",
    group: "Finance & welfare",
    icon: "wallet",
    upstreamPath: "/studentloan",
    endpoint: "sendconsent",
    formId: "consentform",
    fields: [
      {
        name: "consent",
        label: "I consent to the processing of my details for the Student Loan Trust Fund",
        type: "select",
        options: ["Yes", "No"],
        required: true,
        full: true,
      },
    ],
  },
  {
    slug: "starlife",
    title: "STARLife Welfare Consent",
    summary: "Register for the STARLife group welfare scheme",
    subtitle:
      "STARLife group welfare consent form. Provide your parent / guardian details.",
    group: "Finance & welfare",
    icon: "wallet",
    upstreamPath: "/starlife",
    endpoint: "starlifesendconsent",
    formId: "consentform",
    fields: [
      { name: "parent_name", label: "Parent / guardian name", full: true },
      { name: "parent_dob", label: "Parent date of birth", type: "date" },
      { name: "parent_phone", label: "Parent phone", type: "tel" },
      {
        name: "parent_address",
        label: "Parent address",
        type: "textarea",
        full: true,
      },
      {
        name: "consent",
        label: "I consent to the STARLife group welfare scheme",
        type: "select",
        options: ["Yes", "No"],
        required: true,
        full: true,
      },
    ],
  },
];

/**
 * Everything that is NOT (yet) rebuilt inside the portal. `href` starting with
 * http opens the external system; an internal path links within the portal.
 */
export const EXTERNAL_SERVICES: {
  group: string;
  note: string;
  items: { label: string; href: string; body: string }[];
}[] = [
  {
    group: "Still on the official STS site",
    note: "Multi-step or specialised flows that haven't been rebuilt here yet — they open on sts.ug.edu.gh and may ask you to sign in again.",
    items: [
      {
        label: "Medical Examination",
        href: "https://sts.ug.edu.gh/services/medical-start",
        body: "UHS booking, medical history and appointment",
      },
      {
        label: "Transcript / Attestation",
        href: "https://sts.ug.edu.gh/services/transcript-land",
        body: "Order an official transcript or attestation",
      },
      {
        label: "COVID-19 Risk Assessment",
        href: "https://sts.ug.edu.gh/services/covidintro",
        body: "Complete the risk assessment form",
      },
      {
        label: "Psychosocial Assessment",
        href: "https://sts.ug.edu.gh/services/psycho/intro",
        body: "Psychosocial assessment checklist",
      },
      {
        label: "National Service Verification",
        href: "https://sts.ug.edu.gh/services/verifygrad",
        body: "Verify your data for national service",
      },
      {
        label: "First Generation Survey",
        href: "https://sts.ug.edu.gh/services/firstgeneration",
        body: "First generation student survey",
      },
    ],
  },
  {
    group: "Hosted on another system",
    note: "Not part of STS at all — these belong to a separate university system.",
    items: [
      {
        label: "HERC / UGRC Registration",
        href: "https://sts.ug.edu.gh/services/hercreg",
        body: "Hosted on the Self Help iEnabler system",
      },
      {
        label: "UG Hospital E-Consult",
        href: "https://sts.ug.edu.gh/services/emedical",
        body: "UHMC e-consultation portal",
      },
      {
        label: "WES (external)",
        href: "https://www.wes.org",
        body: "World Education Services website",
      },
    ],
  },
];

export function getService(slug: string): ServiceSpec | undefined {
  return SERVICES.find((s) => s.slug === slug);
}
