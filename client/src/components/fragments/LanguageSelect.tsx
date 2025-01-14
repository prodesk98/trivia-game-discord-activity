import {ILanguageSelect} from "../interfaces/ILanguageSelect.ts";
import React from "react";

import enFlag from "../../assets/flags/en.svg";
import esFlag from "../../assets/flags/es.svg";
import frFlag from "../../assets/flags/fr.svg";
import ptFlag from "../../assets/flags/pt.svg";
import deFlag from "../../assets/flags/de.svg";

const LanguageSelect: React.FC<ILanguageSelect> = ({selectedLanguage, handleLanguageChange}) => {
    const languages = new Map([
        ['en', 'English'],
        ['pt', 'Portuguese'],
        ['es', 'Spanish'],
        ['fr', 'French'],
        ['de', 'German']
    ]);

    const flags = new Map([
        ['en', enFlag],
        ['pt', ptFlag],
        ['es', esFlag],
        ['fr', frFlag],
        ['de', deFlag]
    ]);

    return (
        <div className="language-select-container">
            <div className="language-select">
                <div className="selected-option">
                    <img
                        src={flags.get(selectedLanguage)}
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
                        <img src={flags.get('en')} alt={languages.get('en')} className="flag"/>
                        <span>English</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('pt')}
                    >
                        <img src={flags.get('pt')} alt={languages.get('pt')} className="flag"/>
                        <span>Portuguese</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('es')}
                    >
                        <img src={flags.get('es')} alt={languages.get('es')} className="flag"/>
                        <span>Spanish</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('fr')}
                    >
                        <img src={flags.get('fr')} alt={languages.get('fr')} className="flag"/>
                        <span>French</span>
                    </div>
                    <div
                        className="dropdown-option"
                        onClick={() => handleLanguageChange('de')}
                    >
                        <img  src={flags.get('de')} alt={languages.get('de')} className="flag"/>
                        <span>German</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelect;