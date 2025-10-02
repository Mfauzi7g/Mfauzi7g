import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Globe, ChevronDown } from 'lucide-react';

const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', dir: 'ltr' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
    { code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱', dir: 'ltr' }
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = (languageCode) => {
    const selectedLang = languages.find(lang => lang.code === languageCode);
    
    // Change language
    i18n.changeLanguage(languageCode);
    
    // Update document direction for RTL languages
    document.documentElement.dir = selectedLang.dir;
    document.documentElement.lang = languageCode;
    
    // Store preference
    localStorage.setItem('preferred-language', languageCode);
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2"
      >
        <Globe className="w-4 h-4" />
        <span className="text-lg">{currentLanguage.flag}</span>
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <ChevronDown className="w-3 h-3" />
      </Button>

      {isOpen && (
        <Card className="absolute top-full mt-1 right-0 z-50 min-w-48">
          <CardContent className="p-1">
            {languages.map((language) => (
              <Button
                key={language.code}
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 py-2 text-left"
                onClick={() => handleLanguageChange(language.code)}
              >
                <span className="text-lg mr-3">{language.flag}</span>
                <span>{language.name}</span>
                {language.code === currentLanguage.code && (
                  <span className="ml-auto text-blue-600">✓</span>
                )}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default LanguageSelector;