import * as React from 'react';

export interface LlmReadyThread {
    firstBlockId: string;
    llmReadyCode: string;
}

export interface LlmReadyTarget {
    index: number;
    name: string;
    isStage: boolean;
    threads: LlmReadyThread[];
}

export interface LlmReadySupplement {
    targets: LlmReadyTarget[];
}

export interface ScratchGuiHandle {
    getLlmReadySupplement: () => LlmReadySupplement | undefined;
}

export interface ScratchGuiProps {
    [propName: string]: unknown;
}

export type ScratchGuiComponent = React.ForwardRefExoticComponent<
    ScratchGuiProps & React.RefAttributes<ScratchGuiHandle>
>;

declare const GUI: ScratchGuiComponent;
export default GUI;

export function setAppElement(appElement: string | HTMLElement): void;

export interface AppStateProps {
    isFullScreen?: boolean;
    isPlayerOnly?: boolean;
    isTelemetryEnabled?: boolean;
    showTelemetryModal?: boolean;
}

export function AppStateHOC<Props extends object>(
    component: React.ComponentType<Props>,
    localesOnly?: boolean
): React.ComponentType<Props & AppStateProps>;

export function ProjectIdUpdatorHOC<Props extends object, Handle>(
    component: React.ForwardRefExoticComponent<Props & React.RefAttributes<Handle>>
): React.ForwardRefExoticComponent<Props & React.RefAttributes<Handle>>;
export function ProjectIdUpdatorHOC<Props extends object>(
    component: React.ComponentType<Props>
): React.ComponentType<Props>;

export interface ScratchGuiAction {
    type: string;
    [property: string]: unknown;
}

export function reloadProject(): ScratchGuiAction;
export function manualUpdateProject(): ScratchGuiAction;
export function remixProject(): ScratchGuiAction;
export function setFullScreen(isFullScreen: boolean): ScratchGuiAction;
export function setPlayer(isPlayerOnly: boolean): ScratchGuiAction;

export const guiReducers: Record<string, (...args: unknown[]) => unknown>;
export const guiInitialState: unknown;
export const guiMiddleware: unknown;
export function initEmbedded(state: unknown): unknown;
export function initPlayer(state: unknown): unknown;
export function initFullScreen(state: unknown): unknown;
export function initLocale(state: unknown, locale: string): unknown;
export const localesInitialState: unknown;

export const SB3Downloader: React.ComponentType<Record<string, unknown>>;
