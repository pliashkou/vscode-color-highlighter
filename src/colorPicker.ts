import * as vscode from 'vscode';

export class ColorPickerTooltip {
	private readonly context: vscode.ExtensionContext;
	private tooltipDecoration: vscode.TextEditorDecorationType | undefined;
	private onColorSelected: ((color: string) => void) | undefined;
	private currentEditor: vscode.TextEditor | undefined;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	show(position: vscode.Position, colors: string[], onColorSelected: (color: string) => void) {
		this.hide();
		this.onColorSelected = onColorSelected;
		this.currentEditor = vscode.window.activeTextEditor;

		if (!this.currentEditor) {
			return;
		}

		const colorSquares = colors.map(color => `●`).join(' ');
		
		this.tooltipDecoration = vscode.window.createTextEditorDecorationType({
			after: {
				contentText: ` ${colorSquares} ←`,
				color: '#888',
				fontWeight: 'bold',
				margin: '0 0 0 5px'
			},
			isWholeLine: false
		});

		const endPosition = this.currentEditor.selection.end;
		const range = new vscode.Range(endPosition, endPosition);
		this.currentEditor.setDecorations(this.tooltipDecoration, [range]);

		const items = colors.map((color, index) => ({
			label: `$(symbol-color) Color ${index + 1}`,
			description: color,
			color: color
		}));

		setTimeout(() => {
			vscode.window.showQuickPick(items, {
				placeHolder: 'Choose a highlight color'
			}).then(selected => {
				if (selected) {
					onColorSelected(selected.color);
				}
				this.hide();
			});
		}, 100);

		setTimeout(() => {
			this.hide();
		}, 15000);
	}

	selectColor(color: string) {
		if (this.onColorSelected) {
			this.onColorSelected(color);
		}
		this.hide();
	}

	hide() {
		if (this.tooltipDecoration) {
			this.tooltipDecoration.dispose();
			this.tooltipDecoration = undefined;
		}
	}

	dispose() {
		this.hide();
	}
}