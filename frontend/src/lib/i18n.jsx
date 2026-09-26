import { createContext, useContext, useEffect, useState } from 'react'

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'mr', label: 'मराठी' },
]

// UI text only. Step content (names, offices) comes from the data, translated per language.
// Hindi/Marathi strings should be checked by a native speaker before the demo.
const dict = {
  en: {
    admin: 'Admin review',
    heroTitle: 'Know every form, office and fee before you start.',
    heroSub: 'Describe what you want to do. We map the government steps in the order they have to happen, with a link to the official source for each one.',
    askLabel: 'What do you want to do?',
    askPlaceholder: 'e.g. I want to start a small tiffin service from home',
    city: 'City',
    finding: 'Finding…',
    showRoadmap: 'Show my roadmap',
    notCovered: "We don't cover that procedure yet. Try a food business or a small shop registration.",
    genericError: 'Something went wrong. Please try again.',
    examples: ['Start a cloud kitchen', 'Open a small shop', 'Register my startup for GST'],
    newSearch: '← New search',
    lastVerified: 'Last verified',
    sampleData: 'Sample data',
    graph: 'Graph', list: 'List',
    stepsDone: (d, t) => `${d} of ${t} steps done`,
    doNext: 'Do next', status: 'Status', allDone: 'All steps complete', and: 'and',
    onlineForms: 'Online forms', officeVisits: 'Office visits',
    loadError: 'This roadmap could not be loaded.', goBack: 'Go back',
    selectStep: 'Select a step to see what you need.',
    where: 'Where', fee: 'Fee', bring: 'Bring', officialSource: 'Official source ↗',
    finishFirst: 'Finish first:', markDone: 'Mark as done', markUndone: 'Mark as not done',
    tagDone: 'Done', tagStart: 'Start now', tagLocked: 'Cannot start yet',
    types: { document: 'Document', form: 'Online form', visit: 'Office visit', payment: 'Payment', milestone: 'Milestone' },
    disclaimer: 'Not an official government service. Information is gathered from public government websites and may be out of date. Always confirm at the linked official source before applying.',
    privacy: 'Privacy', contact: 'Contact', language: 'Language',
    notFound: "This page doesn't exist.", notFoundSub: 'The link may be old or mistyped.', backToSearch: 'Back to search',
  },
  hi: {
    admin: 'एडमिन समीक्षा',
    heroTitle: 'शुरू करने से पहले हर फ़ॉर्म, दफ़्तर और फ़ीस जानिए।',
    heroSub: 'बताइए आप क्या करना चाहते हैं। हम सरकारी कदमों को उसी क्रम में दिखाते हैं जिसमें उन्हें पूरा करना होता है, और हर कदम के साथ आधिकारिक स्रोत का लिंक देते हैं।',
    askLabel: 'आप क्या करना चाहते हैं?',
    askPlaceholder: 'जैसे: मैं घर से छोटी टिफ़िन सेवा शुरू करना चाहता/चाहती हूँ',
    city: 'शहर',
    finding: 'खोज रहे हैं…',
    showRoadmap: 'मेरा रोडमैप दिखाएँ',
    notCovered: 'यह प्रक्रिया अभी उपलब्ध नहीं है। फ़ूड बिज़नेस या छोटी दुकान का पंजीकरण आज़माएँ।',
    genericError: 'कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।',
    examples: ['क्लाउड किचन शुरू करना', 'छोटी दुकान खोलना', 'स्टार्टअप का GST पंजीकरण'],
    newSearch: '← नई खोज',
    lastVerified: 'अंतिम जाँच',
    sampleData: 'नमूना डेटा',
    graph: 'ग्राफ़', list: 'सूची',
    stepsDone: (d, t) => `${t} में से ${d} कदम पूरे`,
    doNext: 'अगला कदम', status: 'स्थिति', allDone: 'सभी कदम पूरे', and: 'और',
    onlineForms: 'ऑनलाइन फ़ॉर्म', officeVisits: 'दफ़्तर जाना',
    loadError: 'यह रोडमैप लोड नहीं हो सका।', goBack: 'वापस जाएँ',
    selectStep: 'ज़रूरी जानकारी देखने के लिए कोई कदम चुनें।',
    where: 'कहाँ', fee: 'फ़ीस', bring: 'साथ लाएँ', officialSource: 'आधिकारिक स्रोत ↗',
    finishFirst: 'पहले पूरा करें:', markDone: 'पूरा हुआ', markUndone: 'पूरा नहीं हुआ',
    tagDone: 'पूरा', tagStart: 'अभी शुरू करें', tagLocked: 'अभी शुरू नहीं कर सकते',
    types: { document: 'दस्तावेज़', form: 'ऑनलाइन फ़ॉर्म', visit: 'दफ़्तर जाना', payment: 'भुगतान', milestone: 'पड़ाव' },
    disclaimer: 'यह आधिकारिक सरकारी सेवा नहीं है। जानकारी सार्वजनिक सरकारी वेबसाइटों से ली गई है और पुरानी हो सकती है। आवेदन से पहले आधिकारिक स्रोत पर ज़रूर जाँच लें।',
    privacy: 'गोपनीयता', contact: 'संपर्क', language: 'भाषा',
    notFound: 'यह पेज मौजूद नहीं है।', notFoundSub: 'लिंक पुराना या ग़लत हो सकता है।', backToSearch: 'खोज पर लौटें',
  },
  mr: {
    admin: 'अ‍ॅडमिन पुनरावलोकन',
    heroTitle: 'सुरुवात करण्यापूर्वी प्रत्येक अर्ज, कार्यालय आणि शुल्क जाणून घ्या.',
    heroSub: 'तुम्हाला काय करायचे आहे ते सांगा. आम्ही सरकारी टप्पे ज्या क्रमाने पूर्ण करायचे त्या क्रमाने दाखवतो, आणि प्रत्येक टप्प्यासाठी अधिकृत स्रोताची लिंक देतो.',
    askLabel: 'तुम्हाला काय करायचे आहे?',
    askPlaceholder: 'उदा. मला घरून छोटी टिफिन सेवा सुरू करायची आहे',
    city: 'शहर',
    finding: 'शोधत आहोत…',
    showRoadmap: 'माझा रोडमॅप दाखवा',
    notCovered: 'ही प्रक्रिया अजून उपलब्ध नाही. फूड बिझनेस किंवा छोट्या दुकानाची नोंदणी वापरून पहा.',
    genericError: 'काहीतरी चुकले. कृपया पुन्हा प्रयत्न करा.',
    examples: ['क्लाउड किचन सुरू करणे', 'छोटे दुकान उघडणे', 'स्टार्टअपची GST नोंदणी'],
    newSearch: '← नवीन शोध',
    lastVerified: 'शेवटची पडताळणी',
    sampleData: 'नमुना डेटा',
    graph: 'आलेख', list: 'यादी',
    stepsDone: (d, t) => `${t} पैकी ${d} टप्पे पूर्ण`,
    doNext: 'पुढचा टप्पा', status: 'स्थिती', allDone: 'सर्व टप्पे पूर्ण', and: 'आणि',
    onlineForms: 'ऑनलाइन अर्ज', officeVisits: 'कार्यालय भेटी',
    loadError: 'हा रोडमॅप लोड होऊ शकला नाही.', goBack: 'मागे जा',
    selectStep: 'काय लागेल ते पाहण्यासाठी एक टप्पा निवडा.',
    where: 'कुठे', fee: 'शुल्क', bring: 'सोबत आणा', officialSource: 'अधिकृत स्रोत ↗',
    finishFirst: 'आधी पूर्ण करा:', markDone: 'पूर्ण झाले', markUndone: 'पूर्ण झाले नाही',
    tagDone: 'पूर्ण', tagStart: 'आता सुरू करा', tagLocked: 'अजून सुरू करता येत नाही',
    types: { document: 'कागदपत्र', form: 'ऑनलाइन अर्ज', visit: 'कार्यालय भेट', payment: 'पेमेंट', milestone: 'टप्पा' },
    disclaimer: 'ही अधिकृत सरकारी सेवा नाही. माहिती सार्वजनिक सरकारी संकेतस्थळांवरून घेतली आहे आणि जुनी असू शकते. अर्ज करण्यापूर्वी अधिकृत स्रोतावर नक्की तपासा.',
    privacy: 'गोपनीयता', contact: 'संपर्क', language: 'भाषा',
    notFound: 'हे पान अस्तित्वात नाही.', notFoundSub: 'लिंक जुनी किंवा चुकीची असू शकते.', backToSearch: 'शोधाकडे परत',
  },
}

const Ctx = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('lang') || 'en' } catch { return 'en' }
  })
  useEffect(() => {
    document.documentElement.lang = lang
    try { localStorage.setItem('lang', lang) } catch { /* private mode */ }
  }, [lang])
  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>
}

export const useLang = () => useContext(Ctx)

/** Pick a translated field from data, e.g. tr(step, 'name', 'hi') → step.name_hi ?? step.name */
export const tr = (obj, field, lang) => (lang !== 'en' && obj?.[`${field}_${lang}`]) || obj?.[field]
