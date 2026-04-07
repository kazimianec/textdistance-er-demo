import { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Paper,
  Alert,
  Divider,
  Grid,
} from "@mui/material";
import { ComparisonCard } from "../components/ComparisonCard";
import { AlgorithmGrid } from "../components/ScoreBar";
import { useCompare } from "../hooks/useCompare";

// ─── Showcase Data ────────────────────────────────────────────────────────────

interface ShowcaseExample {
  title: string;
  text1: string;
  text2: string;
  expectedMatch: boolean;
  type?: "hard_positive" | "hard_negative" | "normal";
  explanation?: string;
}

interface Showcase {
  label: string;
  description: string;
  examples: ShowcaseExample[];
}

const SHOWCASES: Showcase[] = [
  // 1. Company Name with Abbreviations/Permutations
  {
    label: "Company Names",
    description: "Abbreviation expansion and word permutations — classic hard cases for entity resolution.",
    examples: [
      {
        title: "Abbreviation: IBM",
        text1: "International Business Machines",
        text2: "IBM",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Very different strings but should match. Levenshtein sees 'International Business Machines' vs 'IBM' and scores low despite being the same entity.",
      },
      {
        title: "Abbreviation: NASA (different)",
        text1: "National Aeronautics and Space Administration",
        text2: "North American Soccer Association",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both expand to acronyms NASA but are completely different organizations. Algorithms must detect this.",
      },
      {
        title: "Permutation: Word Reordering",
        text1: "Acme Corporation USA",
        text2: "USA Acme Corporation",
        expectedMatch: true,
        type: "normal",
        explanation: "Same words, different order. Cosine and Sorensen-Dice handle this well.",
      },
      {
        title: "Legal Suffix Variation",
        text1: "Tech Solutions Inc",
        text2: "Tech Solutions Incorporated",
        expectedMatch: true,
        type: "normal",
        explanation: "Same company, different legal suffix. Most algorithms handle this correctly.",
      },
      {
        title: "Common Prefix Trap",
        text1: "Amazon Web Services LLC",
        text2: "Amazon Internet Services GmbH",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both start with 'Amazon' but are different entities (AWS vs Amazon Internet). Prefix-based algorithms may falsely boost similarity.",
      },
    ],
  },

  // 2. Company Name + Address
  {
    label: "Company + Address",
    description: "Matching entities across name and address components with formatting variations.",
    examples: [
      {
        title: "Address Format Variation",
        text1: "123 Main Street, Suite 400, New York, NY 10001",
        text2: "123 Main St Apt 400 New York NY 10001",
        expectedMatch: true,
        type: "normal",
        explanation: "Same address, very different string representations. Overlap and Sorensen-Dice perform well here.",
      },
      {
        title: "Street Type Abbreviation",
        text1: "456 Oak Avenue",
        text2: "456 Oak Ave",
        expectedMatch: true,
        type: "normal",
        explanation: "Simple abbreviation. Levenshtein handles this reasonably.",
      },
      {
        title: "Directional Suffix",
        text1: "789 West 42nd Street",
        text2: "789 East 42nd Street",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Only one character difference (W vs E) but completely different locations.",
      },
      {
        title: "Suite Number Variation",
        text1: "100 Business Park, Building C, Floor 5, Boston MA",
        text2: "100 Business Park Building C-5 Boston MA",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Same location, different format. Token-based algorithms like Cosine perform better.",
      },
    ],
  },

  // 3. Person Full Name Matching
  {
    label: "Person Names",
    description: "Cultural variations, transliterations, and nickname-to-legal name matching.",
    examples: [
      {
        title: "Cultural Variation: Jon vs John",
        text1: "John Smith",
        text2: "Jon Smith",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Very similar spelling but 'Jon' is a legitimate variant of 'John'. Jaro-Winkler handles this well due to prefix weighting.",
      },
      {
        title: "Nickname to Legal",
        text1: "William Smith",
        text2: "Bill Smith",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Bill → William is a common nickname. Pure string matching fails here; need phonetic or learned mapping.",
      },
      {
        title: "Transliteration: José",
        text1: "José García",
        text2: "Jose Garcia",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Accent mark removed and Spanish characters transliterated. Phonetic algorithms help but don't fully capture this.",
      },
      {
        title: "Middle Initial Dropped",
        text1: "Robert James Smith",
        text2: "Robert Smith",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Same person, one has middle name. Levenshtein penalizes length difference unfairly.",
      },
      {
        title: "Suffix: Jr / III",
        text1: "John Smith Jr",
        text2: "John Smith",
        expectedMatch: true,
        type: "normal",
        explanation: "Most algorithms correctly handle suffix removal.",
      },
      {
        title: "Same Name, Different People",
        text1: "Michael Jordan",
        text2: "Michael Jordan (basketball)",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Without disambiguation context, these look identical. Pure string matching cannot distinguish.",
      },
    ],
  },

  // 4. Person Name + Address
  {
    label: "Name + Address",
    description: "Matching people across name and address combinations with format noise.",
    examples: [
      {
        title: "Address with Zip+4",
        text1: "John Doe, 123 Elm St, Springfield IL 62701",
        text2: "John Doe, 123 Elm St, Springfield IL 62701-1234",
        expectedMatch: true,
        type: "normal",
        explanation: "Zip+4 suffix is optional. Most algorithms handle this.",
      },
      {
        title: "Apt vs Suite",
        text1: "Jane Miller, 555 Pine Rd Apt 2B, Chicago IL",
        text2: "Jane Miller, 555 Pine Rd Suite 2B, Chicago IL",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Apt and Suite are synonyms. String distance sees them as different.",
      },
      {
        title: "Street Directional Missing",
        text1: "Bob Wilson, 88 N Main St, Boston MA",
        text2: "Bob Wilson, 88 Main St, Boston MA",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Directional 'N' is optional. Levenshtein penalizes extra character.",
      },
      {
        title: "Spelling Variation in Address",
        text1: "Mary Johnson, 200 Boulevarde Avenue, Austin TX",
        text2: "Mary Johnson, 200 Boulevard Ave, Austin TX",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "'Boulevarde' vs 'Boulevard' is a common spelling error. Levenshtein flags it.",
      },
    ],
  },

  // 5. Long Common Substrings
  {
    label: "Long Common Substrings",
    description: "Detecting shared substrings and word sequences that should (or shouldn't) match.",
    examples: [
      {
        title: "IBM Long Common Substring",
        text1: "International Business Machines Corporation",
        text2: "IBM International Holdings",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both contain 'International' and 'Machines' but are different companies. LCSubstr alone would falsely boost similarity.",
      },
      {
        title: "Shared Corporation Word",
        text1: "United States Corporation",
        text2: "Corporation of United States",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both have 'United States Corporation' but word order reversal creates different entities.",
      },
      {
        title: "University Name Overlap",
        text1: "Massachusetts Institute of Technology",
        text2: "MIT Technology Institute",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Same words rearranged but MIT ≠ MIT Technology Institute.",
      },
      {
        title: "Duplicate Word Trap",
        text1: "Bank of America",
        text2: "America Bank of",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Same words, completely different meaning. Position matters.",
      },
    ],
  },

  // 6. Heavy Transliterations
  {
    label: "Transliterations",
    description: "Cross-alphabet transliterations, diacritics, and phonetic equivalences.",
    examples: [
      {
        title: "Cyrillic: Москва → Moskva",
        text1: "Москва",
        text2: "Moskva",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Same city (Moscow), completely different character sets. Levenshtein sees no relationship.",
      },
      {
        title: "Chinese: 北京 → Beijing",
        text1: "北京",
        text2: "Beijing",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Peking vs Beijing — same place, no shared characters. Requires transliteration knowledge.",
      },
      {
        title: "German: München → Munich",
        text1: "München",
        text2: "Munich",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Umlaut removed and vowel changed. Levenshtein distance is high despite being the same city.",
      },
      {
        title: "Japanese: 東京 → Tokyo",
        text1: "東京",
        text2: "Tokyo",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "No shared characters. Transliteration mapping required.",
      },
      {
        title: "Korean: 서울 → Seoul",
        text1: "서울",
        text2: "Seoul",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Same city, completely different representation.",
      },
    ],
  },

  // 7. Heavy Typos
  {
    label: "Heavy Typos",
    description: "Multiple typos, keyboard adjacency errors, and character substitution chains.",
    examples: [
      {
        title: "Keyboard Adjacency: Quick Brown Fox",
        text1: "The quick brown fox jumps over the lazy dog",
        text2: "Tye quick brown fix jumps over tye lazy dot",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Keyboard adjacency errors (e-q, o-i, g-f). Levenshtein sees high distance but pattern is recognizable.",
      },
      {
        title: "Transposed Letters: Neigborhood",
        text1: "Neighborhood",
        text2: "Neigborhood",
        expectedMatch: true,
        type: "normal",
        explanation: "Single transposition. Levenshtein handles this reasonably well.",
      },
      {
        title: "Double Character Error",
        text1: "Massachusetts",
        text2: "Massachussetts",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "'ss' vs 'uss' — double character placement error. Levenshtein distance is small but not zero.",
      },
      {
        title: "Missing Spaces ( concatenated )",
        text1: "John Smith Esquire",
        text2: "JohnSmithEsquire",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Spaces removed. Levenshtein sees very different strings but Cosine can help.",
      },
      {
        title: "Vowel Swapping",
        text1: "Corporation",
        text2: "Cyrperation",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Multiple vowels swapped — 'o'→'y', 'a'→'e'. Pattern is recognizable but Levenshtein is high.",
      },
    ],
  },

  // 8. Mixed Real-World Noise
  {
    label: "Mixed Noise",
    description: "Combinations of typos, abbreviations, and transliterations in real-world data.",
    examples: [
      {
        title: "OCR + Abbreviation",
        text1: "Johnson & Johnson Pharmaceuticals Inc",
        text2: "J&J Pharma",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "OCR errors + abbreviation + truncation. Levenshtein alone completely fails.",
      },
      {
        title: "Typos + Word Order + Abbreviation",
        text1: "Metropolitan Transportation Authority",
        text2: "MTA Transportaton",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "'Transportation' typo + abbreviation + word order change. Multiple failure modes.",
      },
      {
        title: "Special Characters Noise",
        text1: "O'Reilly Media Inc",
        text2: "OReilly Media Inc",
        expectedMatch: true,
        type: "normal",
        explanation: "Apostrophe removed. Levenshtein handles this fine.",
      },
      {
        title: "Hyphenated vs Space",
        text1: "State-of-the-Art Computing Ltd",
        text2: "State of the Art Computing Ltd",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Hyphenation variant. Multiple algorithms struggle with this.",
      },
      {
        title: "ALL CAPS vs Mixed",
        text1: "INTERNATIONAL BUSINESS MACHINES",
        text2: "International Business Machines",
        expectedMatch: true,
        type: "normal",
        explanation: "Case difference only. Most algorithms normalize this.",
      },
    ],
  },

  // ─── Additional Discoveries ─────────────────────────────────────────────────

  // 9. Brand Name Variations
  {
    label: "Brand Variations",
    description: "Brand vs legal name, product lines vs parent companies, and subsidiary traps.",
    examples: [
      {
        title: "Brand vs Legal Name",
        text1: "Apple Computer Inc",
        text2: "Apple Inc",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "'Computer' dropped from legal name. Levenshtein penalizes the difference unfairly.",
      },
      {
        title: "Parent vs Subsidiary",
        text1: "Alphabet Inc (Google)",
        text2: "Google LLC",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Parent company vs subsidiary. String matching sees them as very different.",
      },
      {
        title: "Product Line Trap",
        text1: "Microsoft Surface Pro",
        text2: "Microsoft Corporation",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both have 'Microsoft' but one is a specific product, the other is the company.",
      },
      {
        title: "Acquisition History",
        text1: "Instagram (Facebook Inc)",
        text2: "Meta Platforms Inc",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Instagram owned by Meta but not the same entity. Disambiguation needed.",
      },
    ],
  },

  // 10. Legal Entity Types
  {
    label: "Legal Entity Types",
    description: "Understanding LLC, Inc, Corp, GmbH, Ltd and when they should or shouldn't match.",
    examples: [
      {
        title: "Inc vs LLC (same entity, different type)",
        text1: "Acme Technologies Inc",
        text2: "Acme Technologies LLC",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Same business, different legal structure. Suffix removal needed before comparison.",
      },
      {
        title: "Inc vs Incorporated",
        text1: "Global Solutions Inc",
        text2: "Global Solutions Incorporated",
        expectedMatch: true,
        type: "normal",
        explanation: "Same entity, expanded suffix. Most algorithms handle this reasonably.",
      },
      {
        title: "Ltd vs Limited",
        text1: "British Holdings Ltd",
        text2: "British Holdings Limited",
        expectedMatch: true,
        type: "normal",
        explanation: "British vs American spelling of same concept.",
      },
      {
        title: "GmbH vs Ltd Confusion",
        text1: "German Auto GmbH",
        text2: "German Auto Ltd",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both are valid legal suffixes but for different countries. A German entity shouldn't match UK entity.",
      },
      {
        title: "Corp Abbreviation",
        text1: "United Corp",
        text2: "United Corporation",
        expectedMatch: true,
        type: "normal",
        explanation: "Abbreviated vs full suffix. Levenshtein handles this fine.",
      },
    ],
  },

  // 11. OCR / E-Scraping Errors
  {
    label: "OCR / Scraping",
    description: "Common OCR and web scraping artifacts: 0 vs O, 1 vs l, misread characters.",
    examples: [
      {
        title: "Zero vs O",
        text1: "Company123",
        text2: "Company12O",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "OCR reads '0' as 'O'. Single character difference but completely different identifiers.",
      },
      {
        title: "One vs l vs I",
        text1: "UserID123",
        text2: "User1D123",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "1 vs l vs I confusion. Common in OCR output.",
      },
      {
        title: " rn vs m (common OCR error)",
        text1: "Warning",
        text2: "Waming",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Missing 'r' — very common OCR error. Levenshtein is only 1 edit away but still flags as non-match at threshold.",
      },
      {
        title: "Scrape Whitespace Noise",
        text1: "John Smith",
        text2: "John\u2003Smith", // hair space
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Invisible unicode spaces from web scraping. Pure string comparison fails.",
      },
      {
        title: "Line Break in Data",
        text1: "123 Main Street",
        text2: "123 Main\nStreet",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "Line break inserted by scraping. Invisible difference.",
      },
    ],
  },

  // 12. URL / Domain Variations
  {
    label: "URL / Domain",
    description: "Domain names, URLs, and web presence variations that represent the same entity.",
    examples: [
      {
        title: "www prefix",
        text1: "google.com",
        text2: "www.google.com",
        expectedMatch: true,
        type: "normal",
        explanation: "www prefix is cosmetic. Levenshtein handles this okay.",
      },
      {
        title: "https vs http",
        text1: "https://example.com",
        text2: "http://example.com",
        expectedMatch: true,
        type: "normal",
        explanation: "Protocol difference only. Normalization needed.",
      },
      {
        title: "Trailing slash",
        text1: "https://github.com/user/repo",
        text2: "https://github.com/user/repo/",
        expectedMatch: true,
        type: "normal",
        explanation: "Trailing slash. Levenshtein sees small difference.",
      },
      {
        title: "Subdomain Variation",
        text1: "shop.example.com",
        text2: "store.example.com",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Both subdomains of same domain but represent different services.",
      },
      {
        title: "Domain Typosquatting",
        text1: "google.com",
        text2: "gogle.com",
        expectedMatch: false,
        type: "hard_positive",
        explanation: "Typosquatting — gogle.com is a different entity. Levenshtein distance is only 1.",
      },
    ],
  },

  // 13. Medical / Scientific Naming
  {
    label: "Scientific Names",
    description: "IUPAC naming, drug names, and gene symbols with abbreviations and full forms.",
    examples: [
      {
        title: "Drug: Generic vs Brand",
        text1: "Acetylsalicylic acid",
        text2: "Aspirin",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Chemical name vs brand name. No string similarity whatsoever.",
      },
      {
        title: "Gene Symbol Case",
        text1: "BRCA1",
        text2: "Brca1",
        expectedMatch: true,
        type: "normal",
        explanation: "Case difference in gene symbol. Most algorithms normalize.",
      },
      {
        title: "Long Chemical Names",
        text1: "(R)-2-hydroxy-2-methylpropanenitrile",
        text2: "2-hydroxy-2-methylpropanenitrile",
        expectedMatch: true,
        type: "hard_negative",
        explanation: "(R)- prefix denotes chirality. Removing it makes the same compound.",
      },
      {
        title: "Abbreviated vs Full Gene",
        text1: "TP53",
        text2: "Tumor Protein P53",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Gene symbol vs full name. No shared characters.",
      },
    ],
  },

  // 14. Historical / Alternative Names
  {
    label: "Historical Names",
    description: "Cities, countries, and organizations with name changes over time.",
    examples: [
      {
        title: "City: Constantinople → Istanbul",
        text1: "Constantinople",
        text2: "Istanbul",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Name changed entirely. No relationship visible to string algorithms.",
      },
      {
        title: "Country: Burma → Myanmar",
        text1: "Burma",
        text2: "Myanmar",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Official name change. Completely different spellings.",
      },
      {
        title: "Company: AT&T → Lucent",
        text1: "AT&T Bell Laboratories",
        text2: "Bell Labs",
        expectedMatch: true,
        type: "hard_positive",
        explanation: "Historical name change + truncation. Levenshtein fails completely.",
      },
      {
        title: "St Petersburg Variation",
        text1: "Saint Petersburg",
        text2: "St. Petersburg",
        expectedMatch: true,
        type: "normal",
        explanation: "Abbreviation vs full form. Common variation.",
      },
    ],
  },
];

// ─── Component ─────────────────────────────────────────────────────────────────

export function Showcases() {
  const [activeTab, setActiveTab] = useState(0);
  const [customText1, setCustomText1] = useState("");
  const [customText2, setCustomText2] = useState("");
  const showcase = SHOWCASES[activeTab];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
          Entity Resolution Showcases
        </Typography>
        <Typography variant="body1" sx={{ color: "rgba(255,255,255,0.6)" }}>
          Explore how different string matching algorithms perform on real-world entity resolution challenges.
          Each showcase demonstrates specific hard positives (look similar but shouldn't match) and
          hard negatives (look different but should match).
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper
        sx={{
          border: "1px solid rgba(255,255,255,0.08)",
          mb: 3,
          overflow: "auto",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            "& .MuiTab-root": { color: "rgba(255,255,255,0.5)" },
            "& .Mui-selected": { color: "#7c4dff !important" },
            "& .MuiTabs-indicator": { backgroundColor: "#7c4dff" },
          }}
        >
          {SHOWCASES.map((s) => (
            <Tab key={s.label} label={s.label} />
          ))}
        </Tabs>

        <Box sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ mb: 3, color: "rgba(255,255,255,0.6)" }}>
            {showcase.description}
          </Typography>

          {/* Examples */}
          {showcase.examples.map((example) => (
            <ComparisonCardWithData key={example.title} {...example} />
          ))}
        </Box>
      </Paper>
    </Container>
  );
}

function ComparisonCardWithData({
  title,
  text1,
  text2,
  expectedMatch,
  type,
  explanation,
}: ShowcaseExample) {
  const { data, isLoading, error } = useCompare(text1, text2);

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, mb: 2, textAlign: "center" }}>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
          Loading...
        </Typography>
      </Paper>
    );
  }

  if (error || !data) {
    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Alert severity="error">Backend error. Is FastAPI running on port 8000?</Alert>
      </Paper>
    );
  }

  return (
    <ComparisonCard
      title={title}
      text1={text1}
      text2={text2}
      scores={data.scores}
      expectedMatch={expectedMatch}
      type={type}
      explanation={explanation}
    />
  );
}
