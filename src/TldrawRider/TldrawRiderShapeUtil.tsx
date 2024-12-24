import React, { useEffect } from "react";
import { ColliderDesc, Vector2, World } from "@dimforge/rapier2d";
import {
	createShapeId,
	Editor,
	Geometry2d,
	HTMLContainer,
	Rectangle2d,
	ShapeUtil,
	TLBaseShape,
	TLDrawShape,
	TLLineShape,
	TLShape,
	TLShapeId,
} from "tldraw";

import spriteURL from "./santa-sled.svg";

import {
	getRotatedTopLeftForRectangle,
	rgbToHex,
	toFixedNumber,
} from "./utils";

/**
 * The type definition for our custom tldraw rider shape.
 */
type ITldrawRiderShape = TLBaseShape<
	"rider",
	{
		/**
		 * The width of the shape.
		 */
		w: number;
		/**
		 * The height of the shape.
		 */
		h: number;
	}
>;

/**
 * Defines how many pixels are in a physics unit.
 *
 * When going from tldraw space to physics space, we need to divide by this
 * unit.
 *
 * When going from physics space to tldraw space, we need to multiply by this
 * unit.
 *
 * https://rapier.rs/docs/user_guides/javascript/common_mistakes#why-is-everything-moving-in-slow-motion
 */
const PHYSICS_UNIT_TO_PX = 100;

/**
 * When we want to render debug lines from Rapier, Rapier returns a value
 * that we have to convert to a hex. When we want to draw these lines in
 * tldraw, we can't provide a hex value but we have to use one of the
 * predefined values. This is a mapping from the hex value to the tldraw
 * color value.
 */
const HEX_TO_TLDRAW_COLOR: { [hex: string]: string } = {
	"#800000": "red",
	"#003300": "green",
	"#990033": "violet",
	"#CC6600": "orange",
	"#1A0000": "yellow",
	"#1F000A": "grey",
	"#000A00": "black",
};

/**
 * A utility class for the tldraw rider shape. This is where we define the
 * shape's behavior, how it renders (its component and indicator), and how it
 * handles different events.
 */
export class TldrawRiderShapeUtil extends ShapeUtil<ITldrawRiderShape> {
	/**
	 * The type of the shape, it's name.
	 */
	static override type = "rider" as const;

	/**
	 * Indicates that the shape is not resizable.
	 */
	override canResize() {
		return false;
	}

	/**
	 * Returned when the shape is hovered over or when it's selected. THis
	 * must return a SVG element.
	 *
	 * @param {ITldrawRiderShape} shape The shape.
	 *
	 * @returns {React.ReactElement} The indicator.
	 */
	indicator(shape: ITldrawRiderShape): React.ReactElement {
		return <rect width={shape.props.w} height={shape.props.h} />;
	}

	/**
	 * The default props that the shape will be rendered with when
	 * click-creating one.
	 *
	 * @returns {ITldrawRiderShape["props"]} The default props.
	 */
	getDefaultProps(): ITldrawRiderShape["props"] {
		return {
			w: 32,
			h: 32,
		};
	}

	/**
	 * Calculates the shape's geometry for hit-testing, bindings, and doing
	 * other geometric calculations.
	 *
	 * @param {ITldrawRiderShape} shape The shape.
	 *
	 * @returns {Geometry2d} The shape's geometry.
	 */
	getGeometry(shape: ITldrawRiderShape): Geometry2d {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		});
	}

	/**
	 * The render method - the React component that will be rendered for the
	 * shape. It takes the shape as an argument. `HTMLContainer` is just a
	 * `div` that's being used to wrap our shape. We can get the shape's
	 * bounds usinig our own `getGeometry` method.
	 *
	 * The contents of this can be treated as a React component. Any hooks
	 * can be used here.
	 *
	 * @param {ITldrawRiderShape} shape The shape.
	 */
	component(shape: ITldrawRiderShape) {
		/**
		 * Dynamically imports Rapier, sets up the physics world, and starts
		 * the game loop.
		 */
		// We disable the rule of hooks here because this is like a functional
		// component, even though ESLint doesn't recognize it as one.
		// eslint-disable-next-line react-hooks/rules-of-hooks
		useEffect(() => {
			// Dynamically import Rapier.
			// https://rapier.rs/docs/user_guides/javascript/getting_started_js#installing-rapier-from-npm
			import("@dimforge/rapier2d").then((RAPIER) => {
				// The custom shape for the rider. We get it here so that we
				// don't have to have the shape as a dependency of this
				// `useEffect`.
				const riderShape = this.editor.getShape(
					shape.id
				) as ITldrawRiderShape;
				if (!riderShape) return;

				// Deselect the shape. Other than the fact it doesn't need to
				// be selected, it also causes a bug where if the shape is
				// selected and it's rotating, the FPS drops significantly.
				// https://github.com/tldraw/tldraw/issues/5134
				this.editor.deselect(shape.id);

				// Creates the world, which has everything necessary for
				// creating and simulating bodies with contacts, joints, and
				// external forces.
				// We create the world with a "realistic" gravity in the y
				// direction. Normally gravity is visualized as `-9.81` but
				// tldraw increases in the y direction as it goes down, so we
				// set it to `9.81`.
				const gravity = {
					x: 0.0,
					y: 9.81,
				};
				const world = new RAPIER.World(gravity);

				// Create a dynamic rigid body for the rider. Rapier and
				// tldraw have different anchors so we have to set the
				// translation of the rigid body to the center of the rider
				// shape.
				// Also, divide by `PHYSICS_UNIT_TO_PX` to convert from
				// tldraw space to physics space.
				// Then we attach the rigid body to the world to simulate it.
				const riderRigidBodyDesc =
					RAPIER.RigidBodyDesc.dynamic().setTranslation(
						(riderShape.x + riderShape.props.w / 2) /
							PHYSICS_UNIT_TO_PX,
						(riderShape.y + riderShape.props.h / 2) /
							PHYSICS_UNIT_TO_PX
					);
				const riderRigidBody =
					world.createRigidBody(riderRigidBodyDesc);

				// Create a cuboid collider and attach it to the rigid body.
				// The collider takes a half width and height as parameters so
				// we specify half the width and height of the rider shape, in
				// physics units.
				const riderColliderDesc = RAPIER.ColliderDesc.roundCuboid(
					//	riderShape.props.w / 2 / PHYSICS_UNIT_TO_PX,
					//	riderShape.props.h / 2 / PHYSICS_UNIT_TO_PX,
					// Our width and height are smaller than the actual size
					// of the sprite so we base the side of the collider
					// around the sled.
					12 / PHYSICS_UNIT_TO_PX,
					1 / PHYSICS_UNIT_TO_PX,
					0.05
				)
					.setTranslation(0, 0.1)
					.setFriction(0)
					.setFrictionCombineRule(RAPIER.CoefficientCombineRule.Min)
					.setRestitution(0);
				const riderCollider = world.createCollider(
					riderColliderDesc,
					riderRigidBody
				);

				// Keeps track of the ids of the tldraw shapes and the handle
				// of their corresponding Rapier colliders.
				let shapeColliderHandles: {
					[shapeId: string]: number;
				} = {};

				// Get all of the shapes that were created on the current page
				// before the rider shape was created.
				// We need to do this because we need to create colliders for
				// all the shapes.
				// TODO: Filter out culled shapes.
				const currentPageShapes = this.editor.getCurrentPageShapes();

				// Go through each shape and:
				// If it's the current rider shape that was created, ignore it.
				// If it's any other rider shape, delete it because for now we
				// only support one rider shape at a time.
				// Any other shape, if it's not a debug line, try to create a
				// collider for it.
				let shapesToDelete: TLShapeId[] = [];
				currentPageShapes.forEach((currentPageShape) => {
					if (currentPageShape.type === "rider") {
						if (currentPageShape.id === shape.id) {
							// The shape is the current rider shape,
							// ignore it since we created a collider for
							// it already.
							return;
						} else {
							// The shape is another rider shape, delete it.
							shapesToDelete = [
								...shapesToDelete,
								currentPageShape.id,
							];
						}
					}

					// If the shape is a debug line, ignore it.
					if (currentPageShape.meta.isDebugLine) {
						return;
					}

					// The shape is not a rider shape, and it's not a
					// deub line, so try to create a collider for it.
					const currentPageShapeColliderDesc =
						createColliderDescForShape(RAPIER, currentPageShape);

					if (currentPageShapeColliderDesc) {
						const currentPageShapeCollider = world.createCollider(
							currentPageShapeColliderDesc
						);

						// Save the handle of the collider so that we can
						// delete it more easily later.
						shapeColliderHandles = {
							...shapeColliderHandles,
							[currentPageShape.id]:
								currentPageShapeCollider.handle,
						};
					} else {
						console.warn(
							`Shape type ${currentPageShape.type} is not supported.`
						);
					}
				});

				// Go through the shapes to delete and delete them from the
				// editor.
				shapesToDelete.forEach((shapeId) => {
					this.editor.deleteShape(shapeId);
				});

				// When a shape is deleted, delete its collider as well.
				// If the deleted shape is the rider shape, also delete its
				// rigid body.
				this.editor.sideEffects.registerAfterDeleteHandler(
					"shape",
					(deletedShape) => {
						if (deletedShape.id === shape.id) {
							// If the shape being deleted is the rider shape,
							// we need to delete the rider's collider and
							// rigid body.
							world.removeCollider(riderCollider, true);
							world.removeRigidBody(riderRigidBody);

							return;
						}

						if (deletedShape.meta.isDebugLine) {
							return;
						}

						if (deletedShape.id in shapeColliderHandles) {
							// Otherwise, for any other shape, check if the
							// shape has a collider and delete it.
							const shapeCollider = world.getCollider(
								shapeColliderHandles[deletedShape.id]
							);
							world.removeCollider(shapeCollider, false);
						}
					}
				);

				/**
				 * The game loop. Everything in this loop runs up to 60 times
				 * per second.
				 *
				 * Here is where we step the physics simulation forward, update
				 * the rider shape's position based on the rigid body's
				 * position, and create the debug lines for the physics world.
				 */
				const gameLoop = () => {
					// Step the physics simulation forward.
					world.step();

					// Get the rider shape with it's properties current to
					// this iteration of the game loop.
					const rider = this.editor.getShape(
						shape.id
					) as ITldrawRiderShape;
					if (!rider) return;

					// Get the new position of the rigid body after the
					// simulation step.
					const position = riderRigidBody.translation();

					// Calculate the next position of the rider shape by
					// taking the new position of the rigid body, adjusting for
					// the difference in anchor points, and converting from
					// physics space to tldraw space.
					const nextPosition = new Vector2(
						(position.x - rider.props.w / 2 / PHYSICS_UNIT_TO_PX) *
							PHYSICS_UNIT_TO_PX,
						(position.y - rider.props.h / 2 / PHYSICS_UNIT_TO_PX) *
							PHYSICS_UNIT_TO_PX
					);

					/**
					 * Calculates the top-left corner position so that the
					 * rider shape's center stays stable as it rotates.
					 */
					const rotatedTopLeftPosition =
						getRotatedTopLeftForRectangle(
							nextPosition.x + rider.props.w / 2,
							nextPosition.y + rider.props.h / 2,
							rider.props.w,
							rider.props.h,
							rider.rotation
						);

					// Update the position and rotation of the rider shape in
					// the editor with the new position.
					this.editor.updateShape({
						id: shape.id,
						type: "rider",
						x: rotatedTopLeftPosition.x,
						y: rotatedTopLeftPosition.y,
					});

					// Note: We have to use `rotateShapesBy` instead of just
					// setting the `rotation` property in `updateShape`
					// so that the shape is rotated around its center.
					const newRotation = toFixedNumber(
						riderRigidBody.rotation(),
						1
					);
					const rotationDiff = newRotation - rider.rotation;
					this.editor.rotateShapesBy([shape.id], rotationDiff);

					// Create the debug lines for the physics world so that we
					// can see where our colliders are.
					// **Note:* This is not optimized so a lot of colliders or
					// complex shapes will slow down the editor. Only use this
					// to debug colliders.
					// createDebugLines(world, this.editor);

					// Run the game loop 60 frames per second.
					requestAnimationFrame(gameLoop);
				};

				// Start the game loop when the shape is created.
				if (riderShape) gameLoop();
			});
		}, [shape.id]);

		return (
			<HTMLContainer
				id={shape.id}
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					pointerEvents: "all",
				}}
			>
				<img src={spriteURL} />
			</HTMLContainer>
		);
	}
}

/**
 * We render the debug lines from Rapier as lines in tldraw. This keeps track
 * of the ids of all the line shapes that we create so that we can delete them
 * before creating new ones.
 */
let debugLineIds: TLShapeId[] = [];

/**
 * Creates the debug lines from Rapier as lines in tldraw.
 *
 * https://rapier.rs/docs/user_guides/javascript/getting_started_js#rendering-debug-shapes
 *
 * @param {World} world The physics world.
 * @param {Editor} editor The tldraw editor.
 */
const createDebugLines = (world: World, editor: Editor) => {
	try {
		// First, delete all of the debug lines that were drawn last time.
		// TODO: It would be nice to be able to keep lines that haven't changed
		// but we'll need a better way to relate tldraw lines to Rapier lines.
		debugLineIds.map((lineId) => editor.deleteShape(lineId));
		debugLineIds = [];

		// Get the vertices and colors of the debug lines from Rapier.
		const { vertices, colors } = world.debugRender();

		// For each vertex:
		for (let i = 0; i < vertices.length / 4; i += 1) {
			// Get the hex color of the normalized RGB color for the line.
			const color = rgbToHex([
				colors[i * 8],
				colors[i * 8 + 1],
				colors[i * 8 + 2],
			]);

			// The tldraw color of the hex color for the line.
			const shapeColor = HEX_TO_TLDRAW_COLOR[color];
			if (!shapeColor) throw new Error(`Unknown color: ${color}`);

			// Tldraw shapes need a `TLShapeId` so we create one. We create it
			// outside of `editor.createShape` so that we can also save it to the
			// `debugLineIds` array.
			const id = createShapeId();

			// Create the debug line shape in tldraw.
			editor.createShape({
				id,
				type: "line",
				props: {
					color: shapeColor,
					points: [
						{
							id: `a${i}`,
							index: `a${i}`,
							x: vertices[i * 4] * PHYSICS_UNIT_TO_PX,
							y: vertices[i * 4 + 1] * PHYSICS_UNIT_TO_PX,
						},
						{
							id: `a${i}`,
							index: `a${i}`,
							x: vertices[i * 4 + 2] * PHYSICS_UNIT_TO_PX,
							y: vertices[i * 4 + 3] * PHYSICS_UNIT_TO_PX,
						},
					],
				},
				meta: {
					isDebugLine: true,
				},
			});

			// Add the id of the shape to the debug line ids so that we can delete
			// it next time.
			debugLineIds = [...debugLineIds, id];
		}
	} catch (error) {
		console.error(`Error creating debug lines: ${error}`);
	}
};

/**
 * Returns a Rapier collider description for the given tldraw shape.
 *
 * @param {TLShape} shape The tldraw shape.
 *
 * @returns {ColliderDesc|undefined} The Rapier collider for the given shape, or `undefined` if the shape is not supported.
 */
const createColliderDescForShape = (
	// @ts-expect-error - Strange type.
	RAPIER: typeof import("/Users/bobcorponoi/Documents/vite-project/node_modules/@dimforge/rapier2d/rapier"),
	shape: TLShape
): ColliderDesc | undefined => {
	switch (shape.type) {
		case "draw": {
			// For a `draw` shape, create a `polyline` collider from the
			// points of the shape, converting from tldraw space to physics
			// space.
			// Draw shapes are treated as a medium level terrain so we give
			// them a friction of 0.5.
			const draw = shape as TLDrawShape;

			return RAPIER.ColliderDesc.polyline(
				new Float32Array(
					draw.props.segments[0].points.flatMap((point) => [
						(shape.x + point.x) / PHYSICS_UNIT_TO_PX,
						(shape.y + point.y) / PHYSICS_UNIT_TO_PX,
					])
				)
			)
				.setFriction(0.5)
				.setRestitution(1.0);
		}
		case "line": {
			// For a `line` shape, create a `segment` collider from the start
			// and end points.
			// Line shapes are treated as ice so we give them a friction of 0.
			const line = shape as TLLineShape;

			// Lines have their start and end points defined as keys with
			// seemingly pseudo-random values. We have to get the points by
			// iterating over the keys and getting the values.
			const points = Object.keys(line.props.points).map(
				(key) => line.props.points[key]
			);

			return RAPIER.ColliderDesc.segment(
				new Vector2(
					(line.x + points[0].x) / PHYSICS_UNIT_TO_PX,
					(line.y + points[0].y) / PHYSICS_UNIT_TO_PX
				),
				new Vector2(
					(line.x + points[1].x) / PHYSICS_UNIT_TO_PX,
					(line.y + points[1].y) / PHYSICS_UNIT_TO_PX
				)
			)
				.setFriction(0)
				.setRestitution(0);
		}
		default:
			return;
	}
};
