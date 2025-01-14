import {ILanguageSelect} from "../interfaces/ILanguageSelect.ts";
import React from "react";

const LanguageSelect: React.FC<ILanguageSelect> = ({selectedLanguage, handleLanguageChange}) => {
    const languages = new Map([
        ['en', 'English'],
        ['pt', 'Portuguese'],
        ['es', 'Spanish'],
        ['fr', 'French'],
        ['de', 'German']
    ]);

    return (
        <div className="language-select-container">
            <div className="language-select">
                <div className="selected-option">
                    <img
                        src={`/src/assets/flags/${selectedLanguage}.svg`}
                        alt={selectedLanguage}
                        className="flag"
                    />
                    <span>
                        {languages.get(selectedLanguage)}
                    </span>
                </div>
                <div className="dropdown">
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('en')}
                    >
                        <img src="/src/assets/flags/en.svg" alt="English" className="flag"/>
                        <span>English</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('pt')}
                    >
                        <img src="/src/assets/flags/pt.svg" alt="Portuguese" className="flag"/>
                        <span>Portuguese</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('es')}
                    >
                        <img src="/src/assets/flags/es.svg" alt="Spanish" className="flag"/>
                        <span>Spanish</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('fr')}
                    >
                        <img src="/src/assets/flags/fr.svg" alt="Spanish" className="flag"/>
                        <span>French</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('de')}
                    >
                        <img src="/src/assets/flags/de.svg" alt="German" className="flag"/>
                        <span>German</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelect;