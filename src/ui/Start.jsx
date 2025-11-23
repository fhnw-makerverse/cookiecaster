import './Start.css'
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import {Link} from "react-router-dom";
import {useIntl, FormattedMessage, defineMessages} from "react-intl";
import * as d3 from "d3";
import config from "../client_config.json";
import * as bootstrap from "bootstrap";

import {importCC3File} from "../utils/FileImport.js";
import {exportCC3File} from "../utils/FileExport.js";
import Graph from "../api/graph/Graph";
import Controller from "../api/Controller";
import SvgHandler from "../api/SvgHandler";
import SelectionHandler from "../api/SelectionHandler";

import "./Start.css";

const profiles = config.profiles;

// ---------- helpers ----------
function validateGraph(formatMessage, messages) {
    const svgh = SvgHandler.instance;
    svgh.clearWarnings();
    const data = Graph.instance.validate();
    data.valid = false;

    const alert = (txt) => window.alert(txt);

    if (data.forms.length === 0) {
        alert(formatMessage(messages.empty));
    } else {
        const msg = [];
        if (data.forms.length > 2) msg.push(formatMessage(messages.morethan2forms)); else if (data.forms.length === 1) {
            if (!data.forms[0].closed) msg.push(formatMessage(messages.open1));
        } else {
            const [form0, form1] = data.forms;
            const bothClosed = form0.closed && form1.closed;
            if (!bothClosed) msg.push(formatMessage(messages.open2)); else {
                const inside = (p, poly) => d3.polygonContains(poly, p); // use d3 for point-in-polygon
                if (form0.meta.width < form1.meta.width && form0.meta.height < form1.meta.height) {
                    if (inside([form0.meta.center.x, form0.meta.center.y], form1.points)) data.outer = 1; else msg.push(formatMessage(messages.concentric));
                } else if (form0.meta.width > form1.meta.width && form0.meta.height > form1.meta.height) {
                    if (inside([form1.meta.center.x, form1.meta.center.y], form0.points)) data.outer = 0; else msg.push(formatMessage(messages.concentric));
                } else {
                    msg.push(formatMessage(messages.concentric));
                }
            }
        }
        if (msg.length > 0) alert(msg.join("\n"));
        if (data.intersections.length > 0) {
            alert(formatMessage(messages.validate));
            svgh.setIntersections(data.intersections);
        } else if (msg.length === 0) data.valid = true;
    }
    return data;
}

// ---------- Local Storage Helpers ----------
function getAllDrawings() {
    return JSON.parse(localStorage.getItem("drawings")) || [];
}

function saveAllDrawings(drawings) {
    localStorage.setItem("drawings", JSON.stringify(drawings));
}

function clearUnsavedDrawings() {
    const drawings = getAllDrawings().filter(d => d.saved);
    saveAllDrawings(drawings);
}

// ---------- component ----------
export default function Start() {
    const intl = useIntl();
    const {formatMessage} = intl;

    const msgs = useMemo(() => defineMessages({
        drawingarea: {id: "start.drawingarea"},
        validate: {id: "alert.validate"},
        concentric: {id: "alert.concentric"},
        empty: {id: "alert.empty"},
        morethan2forms: {id: "alert.morethan2forms"},
        open1: {id: "alert.open1"},
        open2: {id: "alert.open2"},
        export: {id: "alert.export"},
        useful: {id: "alert.useful"},
        noName: {id: "alert.noName"},
        exampleName: {id: "alert.exampleName"},
        enterName: {id: "alert.enterName"},
        saveButton: {id: "alert.saveButton"},
        cancelButton: {id: "alert.cancelButton"},
        noSave: {id: "alert.noSave"},
        save: {id: "alert.save"},
        service: {id: "alert.service"},
        imageUploadTitle: {id: "alert.imageUploadTitle"},
        imageUploadDescription: {id: "alert.imageUploadDescription"},
        shrink: {id: "alert.shrink"},
        scale: {id: "alert.scale"},
        enterFile: {id: "alert.enterFile"},
        back: {id: "alert.back"},
        upload: {id: "alert.upload"},
    }), []);

    useEffect(() => {
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map((el) => new bootstrap.Tooltip(el));
        return () => tooltipList.forEach((t) => t.dispose());
    }, []);

    // ---- local state ----
    const [showGrid, setShowGrid] = useState(true);
    const [pictureUrl, setPictureUrl] = useState(null);
    const [temporaryUrl, setTemporaryUrl] = useState(null);
    const [analyze, setAnalyze] = useState({
        status: false, keys: Object.keys(profiles), data: profiles.default,
    });
    const [zoomIndex, setZoomIndex] = useState(() => SvgHandler.instance.getZoomLevel() - 1);

    const svgRef = useRef(null);
    const fileInputRef = useRef(null);

    // ---- derived values ----
    const size = SvgHandler.instance.getDrawingAreaSize();
    const viewBox = `0 0 ${size} ${size}`;
    const translate = `translate(${size / 2},${size / 2})`;
    const backgroundStyle = pictureUrl ? {
        backgroundImage: `url(${pictureUrl})`,
        backgroundPosition: "center",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
    } : undefined;

    useEffect(() => {
        // Enable all tooltips on page load
        const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
        const tooltipList = [...tooltipTriggerList].map((tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl));

        // Optional: clean up on unmount
        return () => tooltipList.forEach((t) => t.dispose());
    }, []);

    // ---- handlers ----
    const changeGrid = useCallback((checked) => {
        Controller.instance.grid = checked;
        setShowGrid(checked);
        d3.select("#raster").attr("visibility", checked ? "visible" : "hidden");
    }, []);

    const toggleBackground = useCallback((checked) => {
        if (!checked) {
            setTemporaryUrl(pictureUrl);
            setPictureUrl(null);
        } else {
            setPictureUrl((prev) => prev ?? temporaryUrl);
        }
    }, [pictureUrl, temporaryUrl]);

    const changeZoom = useCallback((idx) => {
        const zoom = parseInt(idx, 10);
        SvgHandler.instance.setZoomLevel(zoom + 1);
        setZoomIndex(zoom);
    }, []);

    const saveGraph = useCallback(() => {
        const graph = Graph.instance;
        const jsonData = graph.toJSON();
        const forms = Graph.instance.validate()?.forms || [];
        const svgPath = forms.map(f => f.path).join(" ");

        const name = window.prompt(formatMessage(msgs.enterName), formatMessage(msgs.exampleName));
        if (!name || !name.trim()) {
            window.alert(formatMessage(msgs.noName));
            return;
        }

        try {
            const payload = {
                id: "drawing-" + Date.now(),
                name: name.trim(),
                graphJSON: jsonData,
                svgPath,
                saved: true,
                timestamp: new Date().toISOString(),
            };

            const drawings = getAllDrawings();
            drawings.push(payload);
            saveAllDrawings(drawings);

            window.alert(formatMessage(msgs.save));
        } catch (err) {
            console.error(err);
            window.alert(formatMessage(msgs.noSave));
        }
    }, [formatMessage, msgs]);

    const analyzeGraph = useCallback(() => {
        SelectionHandler.instance.clear();
        const data = validateGraph(formatMessage, msgs);
        if (!data.valid) return;

        const crit = Graph.instance.analyze(data, analyze.data);
        const segCount = Array.from(crit.critSeg).length;
        if (crit.critNodes.length === 0 && segCount === 0) {
            window.alert(formatMessage(msgs.export));
        } else {
            setAnalyze((prev) => ({...prev, status: true, data: profiles.default}));
            const svgh = SvgHandler.instance;
            svgh.setCritNodes(crit.critNodes);
            window.alert(formatMessage(msgs.useful));
            svgh.setCritSeg(crit.critSeg);
        }
    }, [analyze.data, formatMessage, msgs]);

    const onUploadClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFilePicked = useCallback((e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPictureUrl(url);
        setTemporaryUrl(url);
    }, []);

    // ---- grid lines generation ----
    const rasterLines = useMemo(() => {
        const linesY = [];
        const linesX = [];
        const raster = SvgHandler.instance.getRasterSpace();
        const s = SvgHandler.instance.getDrawingAreaSize();
        const end = s / raster;
        for (let i = 1; i < end; i++) {
            const y = i * raster;
            const x = i * raster;
            linesY.push(<line key={`ry-${i}`} x1="0" y1={y} x2={s} y2={y}/>);
            linesX.push(<line key={`rx-${i}`} y1="0" x1={x} y2={s} x2={x}/>);
        }
        return {linesY, linesX};
    }, []);

    // ---- lifecycle: mount -> attach interactions, restore graph ----
    useEffect(() => {
            // mark navbar id (kept from original)
            d3.selectAll("nav.navbar.navbar-default").attr("id", "startNavBar");

            const ctr = Controller.instance;
            const svgSel = d3.select(svgRef.current);
            const svgNode = svgSel.node();

            const pointerPos = (evt) => {
                const [x, y] = d3.pointer(evt, svgNode);
                return {x: Math.round(x), y: Math.round(y)};
            };

            // Lade ausgewählte Zeichnung oder Template
            const selectedId = sessionStorage.getItem("selectedDrawingId");
            const selectedSource = sessionStorage.getItem("selectedSource");

            if (selectedId) {
                try {
                    let graphData = null;

                    if (selectedSource === "template") {
                        // Template aus sessionStorage laden
                        const templateJSON = sessionStorage.getItem("templateGraphJSON");
                        if (templateJSON) {
                            graphData = JSON.parse(templateJSON);
                        }
                    } else if (selectedSource === "local") {
                        // LocalStorage-Zeichnung laden
                        const drawings = getAllDrawings();
                        const drawing = drawings.find(d => d.id === selectedId);
                        if (drawing?.graphJSON) {
                            graphData = drawing.graphJSON;
                        }
                    }

                    if (graphData) {
                        Graph.instance.fromJSON(graphData);
                        SvgHandler.instance.redraw();
                    }
                } catch (err) {
                    console.error("Fehler beim Laden der Zeichnung:", err);
                } finally {
                    // Cleanup sessionStorage
                    sessionStorage.removeItem("selectedDrawingId");
                    sessionStorage.removeItem("selectedSource");
                    sessionStorage.removeItem("templateGraphJSON");
                }
            }

// mouse/touch handlers using D3 v6+ pointer API
            const onDown = (evt) => {
                if (analyze.status) SvgHandler.instance.clearWarnings();
                d3.select("#layer").remove();
                ctr.mouseDown(pointerPos(evt));
            };
            const onMove = (evt) => ctr.mouseMove(pointerPos(evt));
            const onUp = () => {
                ctr.mouseUp();

                try {
                    const graph = Graph.instance;

                    const drawings = getAllDrawings().filter(d => d.saved);
                    const temp = {
                        id: "temp-autosave",
                        name: "Temporär",
                        graphJSON: graph.toJSON(),
                        saved: false,
                        timestamp: new Date().toISOString(),
                    };
                    drawings.push(temp);
                    saveAllDrawings(drawings);
                } catch (err) {
                    console.warn("Autosave skipped:", err);
                }
            };

            svgSel.on("pointerdown", onDown);
            svgSel.on("pointermove", onMove);
            svgSel.on("pointerup", onUp);
            svgSel.on("pointercancel", onUp);
            svgSel.on("mouseleave", onUp);

// keyboard
            const onKeyDown = (evt) => {
                switch (evt.key) {
                    case "Escape":
                        ctr.escape();
                        break;
                    case "Delete":
                        ctr.erase();
                        break;
                    case "c":
                        if (evt.ctrlKey || evt.metaKey) ctr.copy();
                        break;
                    default:
                }
            };
            window.addEventListener("keydown", onKeyDown);

// --- Buttons / modes ---
            d3.select("#reset").on("click", () => {
                ctr.reset();
                clearUnsavedDrawings(); // remove only temporary drawings
            });

// assign pre-instantiated mode objects
            d3.select("#draw").on("click", () => {
                ctr.mode = ctr.modi.MODE_DRAW;
            });

            d3.select("#select").on("click", () => {
                ctr.mode = ctr.modi.MODE_SELECT;
            });

            d3.select("#move").on("click", () => {
                ctr.mode = ctr.modi.MODE_MOVE;
            });

            d3.select("#rotate").on("click", () => {
                ctr.mode = ctr.modi.MODE_ROTATE;
            });

            d3.select("#mirror").on("click", () => ctr.mirror());
            d3.select("#copy").on("click", () => ctr.copy());
            d3.select("#erase").on("click", () => ctr.erase());

            d3.select("#analyze").on("click", () => analyzeGraph());
            d3.select("#save").on("click", () => saveGraph());

            // --- File Import/Export (.cc3) ---
            d3.select("#loadFromFile").on("click", async () => {
                try {
                    const project = await importCC3File();
                    if (!project) return;

                    document.querySelector("#reset")?.click();
                    await new Promise(r => setTimeout(r, 50));

                    Graph.instance.fromJSON(
                        typeof project.graphJSON === "string"
                            ? project.graphJSON
                            : JSON.stringify(project.graphJSON)
                    );

                    SvgHandler.instance.updateMessage();
                    Controller.instance.mode = Controller.instance.modi.MODE_SELECT;
                    Controller.instance.mode.enable();

                    alert("Vorlage erfolgreich geladen!");
                } catch (err) {
                    console.warn("Import abgebrochen oder fehlgeschlagen:", err);
                }
            });

            d3.select("#exportToFile").on("click", () => {
                const data = Graph.instance.toJSON();
                exportCC3File(data, "drawing");
            });

            // --- Init default mode ---
            if (!ctr.mode) {
                ctr.mode = new ctr.modi.MODE_DRAW();
                ctr.mode.enable();
            }

            ctr.mode.enable();
            const graph = Graph.instance;
            if (graph.nodeSize > 0) {
                const svgh = SvgHandler.instance;
                graph.forEachNode((n) => svgh.addNode(n));
                graph.forEachEdge((e) => svgh.addEdge(e));
                d3.select("#layer").remove();
                svgh.updateMessage();
            }

            return () => {
                window.removeEventListener("keydown", onKeyDown);
                svgSel.on(".pointerdown", null).on(".pointermove", null).on(".pointerup", null);
            };
// eslint-disable-next-line react-hooks/exhaustive-deps
        }
        ,
        [analyze.status, analyzeGraph, saveGraph]
    );

    // --- Restore selected drawing from gallery ---
    useEffect(() => {
        const ctr = Controller.instance;
        const graph = Graph.instance;
        const svgh = SvgHandler.instance;
        const drawings = getAllDrawings();
        const selectedId = sessionStorage.getItem("selectedDrawingId");

        const loadDrawing = async (drawing) => {
            if (!drawing) return;

            // Trigger a clean reset
            document.querySelector("#reset")?.click();
            await new Promise((resolve) => setTimeout(resolve, 50)); // wait for reset to complete

            try {
                const json =
                    typeof drawing.graphJSON === "string"
                        ? drawing.graphJSON
                        : JSON.stringify(drawing.graphJSON);

                if (drawing.graphJSON) graph.fromJSON(json);
                else if (drawing.svgPath) graph.fromSvg([drawing.svgPath]);

                svgh.updateMessage();

                // Automatically switch to SELECT mode
                ctr.mode = ctr.modi.MODE_SELECT;
                ctr.mode.enable();
            } catch (err) {
                console.error("Error while loading gallery drawing:", err);
            } finally {
                sessionStorage.removeItem("selectedDrawingId");
                window.__loadedFromGallery = true;
            }
        };

        if (selectedId) {
            const selectedDrawing = drawings.find((d) => d.id === selectedId);
            loadDrawing(selectedDrawing);
        }
    }, []);

    // --- Restore unsaved autosave drawing on mount ---
    useEffect(() => {
        const graph = Graph.instance;
        const temp = getAllDrawings().find((d) => !d.saved);

        if (!temp) return;

        try {
            const json =
                typeof temp.graphJSON === "string"
                    ? temp.graphJSON
                    : JSON.stringify(temp.graphJSON);

            if (temp.graphJSON) graph.fromJSON(json);
            else if (temp.svgPath) graph.fromSvg([temp.svgPath]);

            SvgHandler.instance.updateMessage();
        } catch (err) {
            console.warn("⚠️ Failed to restore autosave:", err);
        }
    }, []); // separate and independent

// keep grid visibility in sync
    useEffect(() => {
        d3.select("#raster").attr("visibility", showGrid ? "visible" : "hidden");
    }, [showGrid]);

// ---- render ----
    return (<div className="start-root">
        <div className="start-layout">
            <div className="canvas-wrap">
                <svg
                    ref={svgRef}
                    viewBox={viewBox}
                    style={backgroundStyle}
                    preserveAspectRatio="xMidYMid meet"
                    id="drawingarea"
                    className="mouse"
                >
                    <g id="raster">
                        {rasterLines.linesY}
                        {rasterLines.linesX}
                    </g>

                    <g id="layer" transform={translate}>
                        <text textAnchor="middle">{formatMessage(msgs.drawingarea)}</text>
                    </g>

                    <line id="moveEdge" visibility="hidden"/>
                    <path id="selectionRect" visibility="hidden"/>
                    <g id="edges"/>
                    <line id="qEdge1" className="qEdge" visibility="hidden"/>
                    <line id="qEdge2" className="qEdge" visibility="hidden"/>
                    <g id="nodes"/>
                    <g id="warnings"/>
                    <g>
                        <text id="message1"/>
                        <text id="message2"/>
                    </g>
                </svg>
            </div>

            <aside className="sidenav">
                <h5>
                    <FormattedMessage id="start.title"/>
                </h5>

                <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2 standard-font">
                        <i className="fas fa-table-cells-large"></i>
                        <FormattedMessage id="start.helplines"/>
                    </div>

                    <div>
                        <label className="switch m-0">
                            <input
                                type="checkbox"
                                checked={showGrid}
                                onChange={(e) => changeGrid(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>

                <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <i className="far fa-image"></i>
                        <FormattedMessage id="start.backgroundImage"/>
                    </div>

                    <div className="material-switch m-0 flex-shrink-0">
                        <label className="switch m-0">
                            <input
                                type="checkbox"
                                checked={!!pictureUrl}
                                onChange={(e) => toggleBackground(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                    </div>
                </div>


                <div className="list-group-item d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                        <i className="fa fa-search"></i>
                        <FormattedMessage id="start.zoom"/>
                    </div>

                    <div className="selector m-0 flex-shrink-0">
                        <select
                            className="form-select form-select-sm"
                            aria-label="Zoom"
                            value={zoomIndex}
                            onChange={(e) => changeZoom(e.target.value)}
                        >
                            {SvgHandler.instance.getZoomLevels().map((z, i) => (<option key={z} value={i}>
                                {z}
                            </option>))}
                        </select>
                    </div>
                </div>

                <div className="d-flex justify-content-start">
                    <button id="reset" type="button" data-bs-toggle="tooltip" data-bs-placement="top"
                            data-bs-title={intl.formatMessage({id: "start.deleteEverything"})}>
                        <i className="far fa-file"></i> <FormattedMessage id="start.new"/>
                    </button>
                </div>

                <button id="draw">
                    <i className="far fa-edit"></i> <FormattedMessage id="start.draw"/>
                </button>

                <button id="select">
                    <i className="fas fa-expand"></i> <FormattedMessage id="start.select"/>
                </button>

                <button id="move">
                    <i className="fas fa-arrows-alt"></i> <FormattedMessage id="start.move"/>
                </button>

                <button id="rotate">
                    <i className="fas fa-sync-alt"></i> <FormattedMessage id="start.rotate"/>
                </button>

                <button id="mirror">
                    <i className="far fa-star-half"></i> <FormattedMessage id="start.mirror"/>
                </button>

                <button id="copy">
                    <i className="far fa-clone"></i> <FormattedMessage id="start.copy"/>
                </button>

                <button id="upload" type="button" onClick={onUploadClick} data-bs-toggle="tooltip"
                        data-bs-placement="top" data-bs-title={intl.formatMessage({id: "start.uploadTooltip"})}>
                    <i className="fas fa-camera"></i> <FormattedMessage id="start.upload"/>
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFilePicked}
                />

                <button id="erase" data-toggle="tooltip" data-placement="top"
                        data-bs-title={intl.formatMessage({id: "start.deleteTooltip"})}>
                    <i className="far fa-trash-alt"></i> <FormattedMessage id="start.delete"/>
                </button>

                <hr/>

                <button id="analyze" data-bs-toggle="tooltip" data-bs-placement="top"
                        data-bs-title={intl.formatMessage({id: "start.analyzeText"})}>
                    <i className="fab fa-searchengin"></i>{" "}
                    <FormattedMessage id="start.analyze"/>
                </button>

                <button id="save">
                    <i className="far fa-save"></i> <FormattedMessage id="start.save"/>
                </button>

                <Link id="load" className="nav-link" to="/gallery">
                    <i className="fas fa-upload"></i>{" "}
                    <FormattedMessage id="start.loadFromGallery"/>
                </Link>

                <button id="loadFromFile">
                    <i className="fas fa-folder-open"></i> Vorlage aus Datei laden
                </button>

                <button id="exportToFile">
                    <i className="fas fa-file-export"></i> Vorlage als Datei exportieren
                </button>

                <Link id="goToExport" className="nav-link" to="/export">
                    <i className="fas fa-download"></i> Export 3D
                </Link>
            </aside>
        </div>
    </div>);
}
