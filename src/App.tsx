import {
	DefaultKeyboardShortcutsDialog,
	DefaultKeyboardShortcutsDialogContent,
	DefaultToolbar,
	DefaultToolbarContent,
	TLComponents,
	Tldraw,
	TldrawUiMenuItem,
	TLUiOverrides,
	useIsToolSelected,
	useTools,
	BaseBoxShapeTool,
} from "tldraw";

import { TldrawRiderShapeUtil } from "./TldrawRider/TldrawRiderShapeUtil";

// Import the styles expected by tldraw.
import "tldraw/tldraw.css";

// Clear the console on hot reload.
if (import.meta.hot) {
	import.meta.hot.on("vite:beforeUpdate", () => console.clear());
}

export class TldrawRiderShapeTool extends BaseBoxShapeTool {
	/**
	 * The name of the tool.
	 */
	static override id = "rider";

	/**
	 * The initial state of the too, which is unselected.
	 */
	static override initial = "idle";

	/**
	 * The name of the shape that the tool creates.
	 */
	override shapeType = "rider";
}

/**
 * Contains overrides for the Tldraw UI. These overrides are used to add our
 * custom tool to the toolbar and keyboard shortcuts menu.
 *
 * First, we have to add our tool to the tools object in the tools override.
 * This is where we define all the basic information about our tool - its
 * icon, label, keyboard shortcut, what happens when we select it, etc.
 *
 * Then, we replace the UI components for the toolbar and keyboard shortcut
 * dialog with our own, that add our tool to the existing default content.
 */
const uiOverrides: TLUiOverrides = {
	tools(editor, tools) {
		tools.rider = {
			id: "rider",
			icon: "color",
			label: "Rider",
			kbd: "r",
			onSelect: () => {
				editor.setCurrentTool("rider");
			},
		};

		return tools;
	},
};

const components: TLComponents = {
	Toolbar: (props) => {
		const tools = useTools();
		const isRiderSelected = useIsToolSelected(tools["rider"]);

		return (
			<DefaultToolbar {...props}>
				<TldrawUiMenuItem
					{...tools["rider"]}
					isSelected={isRiderSelected}
				/>
				<DefaultToolbarContent />
			</DefaultToolbar>
		);
	},
	KeyboardShortcutsDialog: (props) => {
		const tools = useTools();

		return (
			<DefaultKeyboardShortcutsDialog {...props}>
				<TldrawUiMenuItem {...tools["rider"]} />
				<DefaultKeyboardShortcutsDialogContent />
			</DefaultKeyboardShortcutsDialog>
		);
	},
};

/**
 * Add the rider custom shape to the list of custom shapes to add to tldraw.
 */
const customShapeUtils = [TldrawRiderShapeUtil];

/**
 * Add the rider custom tool to the list of custom tools to add to the tldraw
 * toolbar.
 */
const customTools = [TldrawRiderShapeTool];

export const App = () => {
	return (
		<div style={{ position: "absolute", inset: 0 }}>
			<Tldraw
				// Pass in the array of custom shapes.
				shapeUtils={customShapeUtils}
				// Pass in the array of custom tools.
				tools={customTools}
				// Pass in any overrides to the user interface.
				overrides={uiOverrides}
				// Pass in the new Keyboard Shortcuts component.
				components={components}
				onMount={(editor) => {
					editor.updateInstanceState({
						isGridMode: true,
						isDebugMode: true,
					});
				}}
			/>
		</div>
	);
};
