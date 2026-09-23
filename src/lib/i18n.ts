import { useAppSelector } from '@/store/hooks';

export type Locale = 'en' | 'hi';

const translations: Record<string, string> = {
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
