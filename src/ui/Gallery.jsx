import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";
import { exportCC3File } from "../utils/FileExport.js";
import "./Gallery.css";

// Dynamischer Import aller JSON Templates im Ordner /templates
const templateFiles = import.meta.glob("../templates/*.json", { eager: true });

export default function Gallery() {
    const [templates, setTemplates] = useState([]);
    const [customItems, setCustomItems] = useState([]);
    const navigate = useNavigate();

    // --- Templates laden ---
    useEffect(() => {
        const loaded = Object.entries(templateFiles).map(([path, mod]) => ({
            id: `tpl-${path.split("/").pop().replace(".json", "")}`,
            name: mod.name || path.split("/").pop().replace(".json", ""),
            svgPath: mod.svgPath || mod.svg || "",
            graphJSON: mod.graphJSON || mod,
            isTemplate: true
        }));
        setTemplates(loaded);
    }, []);

    // --- Eigene Zeichnungen aus LocalStorage laden ---
    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem("drawings")) || [];
        setCustomItems(stored.filter(d => d.saved));
    }, []);

    // --- Handler: Template oder eigenes Design öffnen ---
    const handleSelect = useCallback((item) => {
        if (!item?.svgPath && !item?.svg) return;
        sessionStorage.setItem("selectedDrawingId", item.id);
        sessionStorage.setItem("selectedSource", item.isTemplate ? "template" : "local");
        // Speichere das graphJSON für Templates
        if (item.isTemplate && item.graphJSON) {
            sessionStorage.setItem("templateGraphJSON", JSON.stringify(item.graphJSON));
        }
        navigate("/start");
    }, [navigate]);

    // --- Handler: Löschen nur bei Custom Items ---
    const handleDelete = useCallback((id) => {
        const rest = customItems.filter(i => i.id !== id);
        localStorage.setItem("drawings", JSON.stringify(rest));
        setCustomItems(rest);
    }, [customItems]);

    // --- Leerer Zustand ---
    if (templates.length === 0 && customItems.length === 0) {
        return (
            <div className="gallery-empty text-center p-5">
                <FormattedMessage id="gallery.empty" defaultMessage="Noch keine gespeicherten Formen" />
                <div className="mt-4">
                    <Link to="/start" className="btn btn-primary">
                        <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="gallery-container">
            {/* === Templates === */}
            {templates.length > 0 && (
                <>
                    <h2 className="mt-4"><FormattedMessage id="gallery.templates" defaultMessage="Vorlagen" /></h2>
                    <div className="gallery-grid">
                        {templates.map(tpl => (
                            <div key={tpl.id} className="gallery-item">
                                <svg viewBox="0 0 200 200" className="gallery-preview"
                                     onClick={() => handleSelect(tpl)}>
                                    <path d={tpl.svgPath || ""} />
                                </svg>
                                <div className="gallery-caption">
                                    <p>{tpl.name}</p>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => exportCC3File(tpl.graphJSON, tpl.name)}
                                    >
                                        <FormattedMessage id="gallery.export" defaultMessage="Exportieren" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* === Eigene Zeichnungen === */}
            {customItems.length > 0 && (
                <>
                    <h2 className="mt-5"><FormattedMessage id="gallery.custom" defaultMessage="Eigene Formen" /></h2>
                    <div className="gallery-grid">
                        {customItems.map(item => (
                            <div key={item.id} className="gallery-item">
                                <svg
                                    viewBox="0 0 200 200"
                                    className="gallery-preview"
                                    onClick={() => handleSelect(item)}
                                >
                                    <path d={item.svgPath || item.svg} />
                                </svg>
                                <div className="gallery-caption">
                                    <p>{item.name}</p>
                                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                                        <FormattedMessage id="gallery.delete" defaultMessage="Löschen" />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => exportCC3File(item.graphJSON, item.name)}
                                    >
                                        <FormattedMessage id="gallery.export" defaultMessage="Exportieren" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <Link to="/start" className="btn btn-primary mt-5">
                <FormattedMessage id="gallery.backButton" defaultMessage="Zurück" />
            </Link>
        </div>
    );
}