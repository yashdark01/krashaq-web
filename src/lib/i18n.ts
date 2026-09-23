import { useAppSelector } from '@/store/hooks';

export type Locale = 'en' | 'hi';

const translations: Record<string, string> = {
  'A NEW PERSPECTIVE ON YOUR LAND': 'आपकी भूमि का नया दृष्टिकोण',
  Today: 'आज',
  'Good things grow': 'अच्छे परिणाम बढ़ते हैं',
  'from better decisions.': 'बेहतर निर्णयों से।',
  'Your farm, your weather, and a little help with what comes next.': 'आपका खेत, आपका मौसम और अगले कदम के लिए थोड़ी मदद।',
  'GROW WITH CONFIDENCE': 'विश्वास के साथ बढ़ें',
  'YOUR FARM COMPANION': 'आपका कृषि साथी',
  "Ask about your farm's forecast or explore trusted agricultural knowledge.": 'अपने खेत का पूर्वानुमान पूछें या विश्वसनीय कृषि ज्ञान देखें।',
  'Ask Krashaq': 'Krashaq से पूछें',
  'YOUR FARM AT A GLANCE': 'आपके खेत की एक झलक',
  'Everything important, in one place.': 'हर महत्वपूर्ण बात, एक ही जगह।',
  'FIELD NOTE': 'खेत की टिप्पणी',
  'Small steps make stronger farms.': 'छोटे कदम खेतों को मजबूत बनाते हैं।',
  'GROWING BETTER, TOGETHER.': 'साथ मिलकर बेहतर बढ़ें।',
  'FARM INTELLIGENCE': 'कृषि बुद्धिमत्ता',
  'YOUR DAILY PERSPECTIVE': 'आपका दैनिक दृष्टिकोण',
  'Conversations': 'बातचीत',
  'Search conversations': 'बातचीत खोजें',
  Loading: 'लोड हो रहा है',
  'Good things grow here.': 'यहाँ अच्छी चीज़ें बढ़ती हैं।',
  'Every season brings questions.': 'हर मौसम अपने सवाल लाता है।',
  'Your farm companion': 'आपका कृषि साथी',
  'Your documents': 'आपके दस्तावेज़',
  'My farms': 'मेरे खेत',
  'Farm alerts': 'खेत के अलर्ट',
  Markets: 'बाज़ार',
  'Schemes & guidance': 'योजनाएं और मार्गदर्शन',
  Settings: 'सेटिंग्स',
  'Manage your farms': 'अपने खेत प्रबंधित करें',
  'View farms': 'खेत देखें',
  'Open forecast': 'पूर्वानुमान खोलें',
  'Review alerts': 'अलर्ट देखें',
  'Ask Krashaq AI': 'Krashaq AI से पूछें',
  'New conversation': 'नई बातचीत',
  Recent: 'हाल की बातचीत',
  Archived: 'संग्रहीत',
  'What would you like to understand?': 'आप क्या समझना चाहते हैं?',
  'What is happening on your farm?': 'आपके खेत में क्या हो रहा है?',
  'Trusted sources': 'विश्वसनीय स्रोत',
  'Farm-aware guidance': 'खेत के अनुसार मार्गदर्शन',
  'No matching records.': 'कोई मिलान रिकॉर्ड नहीं मिला।',
  'You’re all caught up.': 'आप पूरी तरह अपडेट हैं।',
  'YOUR GLOBAL KNOWLEDGE ASSISTANT': 'आपका वैश्विक ज्ञान सहायक',
  'Krashaq AI': 'Krashaq AI',
  'Your local forecast': 'आपका स्थानीय पूर्वानुमान',
  Ready: 'तैयार',
  'New chat': 'नई चैट',
  'A BETTER WAY TO ASK': 'पूछने का बेहतर तरीका',
  'Hindi + English': 'हिन्दी + अंग्रेज़ी',
  'Krashaq can make mistakes. Verify important farm and safety decisions.': 'Krashaq से गलतियाँ हो सकती हैं। खेत और सुरक्षा से जुड़े महत्वपूर्ण निर्णयों की पुष्टि करें।',
  'Your question': 'आपका सवाल',
  'Open conversations': 'बातचीत खोलें',
};

export function translate(value: string, locale: Locale) {
  return locale === 'hi' ? translations[value] ?? value : value;
}

export function useLocale() {
  return useAppSelector((state) => state.ui.locale) as Locale;
}

export function useT() {
  const locale = useLocale();
  return (value: string) => translate(value, locale);
}
