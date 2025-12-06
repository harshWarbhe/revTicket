package com.revticket.service;

import com.revticket.entity.Language;
import com.revticket.repository.LanguageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LanguageService {

    @Autowired
    private LanguageRepository languageRepository;

    public List<Language> getAllActiveLanguages() {
        return languageRepository.findByIsActiveTrueOrderByNameAsc();
    }

    public Language addLanguage(String name) {
        if (languageRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Language already exists");
        }
        Language language = new Language();
        language.setName(name);
        language.setIsActive(true);
        return languageRepository.save(language);
    }

    public void initializeDefaultLanguages() {
        String[] defaultLanguages = {"English", "Hindi", "Tamil", "Telugu", "Malayalam", "Kannada", "Bengali", "Marathi", "Punjabi", "Gujarati"};
        for (String lang : defaultLanguages) {
            if (languageRepository.findByName(lang).isEmpty()) {
                addLanguage(lang);
            }
        }
    }
}
