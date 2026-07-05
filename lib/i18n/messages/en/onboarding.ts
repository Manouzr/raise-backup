export const onboarding = {
  rail: {
    account: "Account",
    categories: "Categories",
    guardrails: "Guardrails",
    platforms: "Platforms",
    trialPre: "Pro trial",
    trialPost: "days, no card needed.",
    footer: "You stay in control of every bid — never a bot.",
  },
  cats: {
    watches: "Vintage watches",
    ram: "RAM & components",
    gpu: "GPUs & hardware",
    gameboy: "Game Boy & retro",
    keyboards: "Mechanical keyboards",
    lenses: "Camera lenses",
  },
  step1: {
    title: "Create your account",
    subtitle: "Two minutes, and your radar starts hunting.",
    firstName: "First name",
    email: "Email",
    password: "Password",
    continue: "Continue",
    haveAccount: "Already have an account?",
    login: "Log in",
    errName: "Enter your first name.",
    errEmail: "Invalid email.",
    errPassword: "Password: 6 characters minimum.",
  },
  step2: {
    title: "What are you hunting?",
    subtitle:
      "Choose at least one category. BidEdge will estimate its market value from real sales.",

    customPlaceholder: 'Something else? e.g. "60s jazz vinyl"',
    add: "Add",
    back: "Back",
    continue: "Continue · {n} categories",
    pickOne: "Pick at least one category",
  },
  step3: {
    title: "Your guardrails",
    subtitle:
      "Set them calmly; they’ll hold under pressure. You can adjust them anytime in Settings.",

    budget: "Monthly bidding budget",
    ceiling: "Default ceiling on a new lot",
    humanTitle: "Human confirmation before every bid",
    humanHint: "BidEdge never bids on its own — this guardrail is permanent.",
    alwaysOn: "always on",
    humanAria: "Human confirmation — always on",
    permanentNotify: "This guardrail is permanent — human in the loop, always.",
    continue: "Continue",
    back: "Back",
  },
  step4: {
    title: "Connect your platforms",
    subtitle:
      "BidEdge spots and suggests the right bid — you place it, at the right moment.",
    connected: "Connected",
    connect: "Connect",
    runScan: "Run the first scan",
    back: "Back",
    drouotNotify: "Drouot connected to your workspace",
  },
  step5: {
    title: "Setting your market value…",
    scanPast: "Collecting past sales across {n} categories…",
    scanLive: "Live search of current listings…",
    scanCalibrate: "Calibrating market value — comparing sources…",
    doneTitle: "Your radar is ready.",
    doneSubtitle:
      "Market value is set across {n} categories. Lots below value are already showing up.",

    open: "Open the radar",
    creating: "Creating…",
    firstScanDone: "First scan complete — happy hunting",
  },
  errors: {
    accountExists: "An account already exists with this email.",
    createFailed: "Couldn't create your account. Check your details.",
    createRetry: "Couldn't create your account. Try again in a moment.",
  },
  cursor: {
    creatingAccount: "creating the account",
    email: "the email…",
    offWeGo: "and off we go",
    typingCategory: "typing the category…",
    exampleProduct: "nintendo switch",
    added: "and there, added",
  },
} as const;
