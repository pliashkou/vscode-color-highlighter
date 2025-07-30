// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ColorPickerTooltip } from './colorPicker';

interface HighlightRange {
	range: vscode.Range;
	color: string;
	decoration: vscode.TextEditorDecorationType;
}

interface StoredHighlight {
	startLine: number;
	startCharacter: number;
	endLine: number;
	endCharacter: number;
	color: string;
}

class CodeHighlighter {
	private highlights: Map<string, HighlightRange[]> = new Map();
	private readonly context: vscode.ExtensionContext;
	private colorPicker: ColorPickerTooltip;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.colorPicker = new ColorPickerTooltip(context);
		this.setupEventHandlers();
		this.loadStoredHighlights();
	}

	private setupEventHandlers() {
		vscode.workspace.onDidChangeTextDocument((event) => {
			this.adjustHighlights(event);
		});

		vscode.window.onDidChangeActiveTextEditor((editor) => {
			if (editor) {
				this.loadHighlightsForDocument(editor);
				this.refreshHighlights(editor);
			}
		});

	}

	private getDocumentKey(document: vscode.TextDocument): string {
		return document.uri.toString();
	}

	private getConfiguredColors(): string[] {
		const config = vscode.workspace.getConfiguration('codeHighlighter');
		return config.get<string[]>('colors', [
			'#ffeb3b40',
			'#4caf5040',
			'#2196f340',
			'#ff572240',
			'#9c27b040',
			'#ff980040'
		]);
	}

	highlightWithColor(colorIndex: number) {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.selection.isEmpty) {
			vscode.window.showWarningMessage('Please select text to highlight');
			return;
		}

		const colors = this.getConfiguredColors();
		if (colorIndex < 1 || colorIndex > colors.length) {
			vscode.window.showWarningMessage(`Color ${colorIndex} not available. Available colors: 1-${colors.length}`);
			return;
		}

		const color = colors[colorIndex - 1];
		this.highlightSelection(editor, color);
	}

	clearHighlightAtSelection() {
		const editor = vscode.window.activeTextEditor;
		if (!editor || editor.selection.isEmpty) {
			return;
		}

		const docKey = this.getDocumentKey(editor.document);
		const highlights = this.highlights.get(docKey);
		
		if (!highlights || highlights.length === 0) {
			return;
		}

		const selection = editor.selection;
		const highlightsToModify: { index: number; highlight: HighlightRange }[] = [];
		const highlightsToRemove: number[] = [];

		for (let i = 0; i < highlights.length; i++) {
			const highlight = highlights[i];
			const intersection = highlight.range.intersection(selection);
			
			if (intersection) {
				highlightsToModify.push({ index: i, highlight });
			}
		}

		for (let i = highlightsToModify.length - 1; i >= 0; i--) {
			const { index, highlight } = highlightsToModify[i];
			const originalRange = highlight.range;
			const selectionRange = selection;
			
			highlight.decoration.dispose();
			highlights.splice(index, 1);

			const beforeStart = originalRange.start;
			const beforeEnd = selectionRange.start;
			const afterStart = selectionRange.end;
			const afterEnd = originalRange.end;

			if (beforeStart.isBefore(beforeEnd)) {
				const beforeDecoration = vscode.window.createTextEditorDecorationType({
					backgroundColor: highlight.color,
					isWholeLine: false
				});
				const beforeHighlight: HighlightRange = {
					range: new vscode.Range(beforeStart, beforeEnd),
					color: highlight.color,
					decoration: beforeDecoration
				};
				highlights.splice(index, 0, beforeHighlight);
			}

			if (afterStart.isBefore(afterEnd)) {
				const afterDecoration = vscode.window.createTextEditorDecorationType({
					backgroundColor: highlight.color,
					isWholeLine: false
				});
				const afterHighlight: HighlightRange = {
					range: new vscode.Range(afterStart, afterEnd),
					color: highlight.color,
					decoration: afterDecoration
				};
				highlights.push(afterHighlight);
			}
		}

		this.saveHighlightsForDocument(docKey);
		this.refreshHighlights(editor);
	}

	private highlightSelection(editor: vscode.TextEditor, color: string) {
		const selection = editor.selection;
		const docKey = this.getDocumentKey(editor.document);
		
		if (!this.highlights.has(docKey)) {
			this.highlights.set(docKey, []);
		}

		const highlights = this.highlights.get(docKey)!;
		
		// First, handle any existing highlights that overlap with the selection
		const highlightsToModify: { index: number; highlight: HighlightRange }[] = [];
		const highlightsToRemove: number[] = [];

		for (let i = 0; i < highlights.length; i++) {
			const highlight = highlights[i];
			const intersection = highlight.range.intersection(selection);
			
			if (intersection) {
				highlightsToModify.push({ index: i, highlight });
			}
		}

		// Process overlapping highlights (remove intersecting parts, keep non-intersecting parts)
		for (let i = highlightsToModify.length - 1; i >= 0; i--) {
			const { index, highlight } = highlightsToModify[i];
			const originalRange = highlight.range;
			const selectionRange = selection;
			
			highlight.decoration.dispose();
			highlights.splice(index, 1);

			// Keep the part before the selection (if any)
			const beforeStart = originalRange.start;
			const beforeEnd = selectionRange.start;
			if (beforeStart.isBefore(beforeEnd)) {
				const beforeDecoration = vscode.window.createTextEditorDecorationType({
					backgroundColor: highlight.color,
					isWholeLine: false
				});
				const beforeHighlight: HighlightRange = {
					range: new vscode.Range(beforeStart, beforeEnd),
					color: highlight.color,
					decoration: beforeDecoration
				};
				highlights.splice(index, 0, beforeHighlight);
			}

			// Keep the part after the selection (if any)
			const afterStart = selectionRange.end;
			const afterEnd = originalRange.end;
			if (afterStart.isBefore(afterEnd)) {
				const afterDecoration = vscode.window.createTextEditorDecorationType({
					backgroundColor: highlight.color,
					isWholeLine: false
				});
				const afterHighlight: HighlightRange = {
					range: new vscode.Range(afterStart, afterEnd),
					color: highlight.color,
					decoration: afterDecoration
				};
				highlights.push(afterHighlight);
			}
		}

		// Now add the new highlight
		const decorationType = vscode.window.createTextEditorDecorationType({
			backgroundColor: color,
			isWholeLine: false
		});

		const highlight: HighlightRange = {
			range: new vscode.Range(selection.start, selection.end),
			color: color,
			decoration: decorationType
		};

		highlights.push(highlight);
		
		this.saveHighlightsForDocument(docKey);
		this.refreshHighlights(editor);
	}

	private adjustHighlights(event: vscode.TextDocumentChangeEvent) {
		const docKey = this.getDocumentKey(event.document);
		const highlights = this.highlights.get(docKey);
		
		if (!highlights || highlights.length === 0) {
			return;
		}

		for (const change of event.contentChanges) {
			for (const highlight of highlights) {
				const newRange = this.adjustRangeForChange(highlight.range, change);
				if (newRange) {
					highlight.range = newRange;
				}
			}
		}

		const editor = vscode.window.activeTextEditor;
		if (editor && editor.document === event.document) {
			this.refreshHighlights(editor);
			this.saveHighlightsForDocument(docKey);
		}
	}

	private adjustRangeForChange(range: vscode.Range, change: vscode.TextDocumentContentChangeEvent): vscode.Range | null {
		const changeStart = change.range.start;
		const changeEnd = change.range.end;
		const newText = change.text;
		const linesAdded = newText.split('\n').length - 1;
		const lastLineLength = newText.split('\n').pop()?.length || 0;

		if (changeEnd.isBefore(range.start)) {
			const lineDiff = linesAdded - (changeEnd.line - changeStart.line);
			let newStart: vscode.Position;
			let newEnd: vscode.Position;

			if (lineDiff === 0) {
				const charDiff = newText.length - (changeEnd.character - changeStart.character);
				newStart = range.start.translate(0, range.start.line === changeStart.line ? charDiff : 0);
				newEnd = range.end.translate(0, range.end.line === changeStart.line ? charDiff : 0);
			} else {
				newStart = range.start.translate(lineDiff);
				newEnd = range.end.translate(lineDiff);
			}

			return new vscode.Range(newStart, newEnd);
		}

		if (changeStart.isAfter(range.end)) {
			return range;
		}

		if (changeStart.isBeforeOrEqual(range.start) && changeEnd.isAfterOrEqual(range.end)) {
			return null;
		}

		return range;
	}

	private refreshHighlights(editor: vscode.TextEditor) {
		const docKey = this.getDocumentKey(editor.document);
		const highlights = this.highlights.get(docKey);
		
		if (!highlights) {
			return;
		}

		const decorationMap = new Map<vscode.TextEditorDecorationType, vscode.Range[]>();
		
		for (const highlight of highlights) {
			if (!decorationMap.has(highlight.decoration)) {
				decorationMap.set(highlight.decoration, []);
			}
			decorationMap.get(highlight.decoration)!.push(highlight.range);
		}

		for (const [decoration, ranges] of decorationMap) {
			editor.setDecorations(decoration, ranges);
		}
	}

	clearAllHighlights() {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		const docKey = this.getDocumentKey(editor.document);
		const highlights = this.highlights.get(docKey);
		
		if (highlights) {
			for (const highlight of highlights) {
				highlight.decoration.dispose();
			}
			this.highlights.delete(docKey);
			this.saveHighlightsForDocument(docKey);
		}
	}

	private loadStoredHighlights() {
		const storedHighlights = this.context.globalState.get<Record<string, StoredHighlight[]>>('codeHighlighter.highlights', {});
		
		for (const [docKey, highlights] of Object.entries(storedHighlights)) {
			if (highlights && highlights.length > 0) {
				this.highlights.set(docKey, []);
			}
		}
	}

	private loadHighlightsForDocument(editor: vscode.TextEditor) {
		const docKey = this.getDocumentKey(editor.document);
		const storedHighlights = this.context.globalState.get<Record<string, StoredHighlight[]>>('codeHighlighter.highlights', {});
		const highlights = storedHighlights[docKey];
		
		if (!highlights || highlights.length === 0) {
			return;
		}

		if (!this.highlights.has(docKey)) {
			this.highlights.set(docKey, []);
		}

		const currentHighlights = this.highlights.get(docKey)!;
		for (const highlight of currentHighlights) {
			highlight.decoration.dispose();
		}
		currentHighlights.length = 0;

		for (const stored of highlights) {
			const decorationType = vscode.window.createTextEditorDecorationType({
				backgroundColor: stored.color,
				isWholeLine: false
			});

			const range = new vscode.Range(
				new vscode.Position(stored.startLine, stored.startCharacter),
				new vscode.Position(stored.endLine, stored.endCharacter)
			);

			const highlightRange: HighlightRange = {
				range: range,
				color: stored.color,
				decoration: decorationType
			};

			currentHighlights.push(highlightRange);
			editor.setDecorations(decorationType, [range]);
		}
	}

	private saveHighlightsForDocument(docKey: string) {
		const storedHighlights = this.context.globalState.get<Record<string, StoredHighlight[]>>('codeHighlighter.highlights', {});
		
		const highlights = this.highlights.get(docKey);
		if (!highlights || highlights.length === 0) {
			delete storedHighlights[docKey];
		} else {
			storedHighlights[docKey] = highlights.map(h => ({
				startLine: h.range.start.line,
				startCharacter: h.range.start.character,
				endLine: h.range.end.line,
				endCharacter: h.range.end.character,
				color: h.color
			}));
		}

		this.context.globalState.update('codeHighlighter.highlights', storedHighlights);
	}

	getColorPicker(): ColorPickerTooltip {
		return this.colorPicker;
	}

	dispose() {
		for (const highlights of this.highlights.values()) {
			for (const highlight of highlights) {
				highlight.decoration.dispose();
			}
		}
		this.highlights.clear();
		this.colorPicker.dispose();
	}
}

export function activate(context: vscode.ExtensionContext) {
	const highlighter = new CodeHighlighter(context);

	const clearHighlightsCommand = vscode.commands.registerCommand('codeHighlighter.clearHighlights', () => {
		highlighter.clearAllHighlights();
	});

	const clearHighlightAtSelectionCommand = vscode.commands.registerCommand('codeHighlighter.clearHighlightAtSelection', () => {
		highlighter.clearHighlightAtSelection();
	});

	const commands: vscode.Disposable[] = [clearHighlightsCommand, clearHighlightAtSelectionCommand];

	for (let i = 1; i <= 9; i++) {
		const command = vscode.commands.registerCommand(`codeHighlighter.highlight${i}`, () => {
			highlighter.highlightWithColor(i);
		});
		commands.push(command);
	}

	context.subscriptions.push(...commands);
	
	context.subscriptions.push({
		dispose: () => highlighter.dispose()
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}
