Tetrion is a classic tetris game in a 3d environment for the web.


 ==About================================================================

The moment a player completes a horizontal line, the line explodes and all the 
included cubes gain mass and physical forces to drop out of the scene.
When the game is finished all the cubes gain mass and gravity takes over.

The app have two different navigations. The main app navigation and the 
game menu. The first one is used to create games, skins and watch replays 
and on the second one to configure the video and audio settings, to bind
different input keys or just pause, restart or exit the game.

When a player creates a new game have the option to choose the dimentions
of the board inorder to increase or decrease the game difficulty.

The player have the ability to use different skins 
for the blocks or even to create custom skins and save new themes.

In the replays section, the player can re-watch the last 10 games.
 
 ==Implementation=========================================================
   
The user interface developed using the Ionic and Angular frameworks.
The libraries Three.js and Cannon.js are used for the graphics and the
physics. Both run in a different web worker, leaving Angular to run 
alone in the main thread for a better interactive user experience.

Data storage, user authentication, hosting and other services are implemented using 
the Firebase platform. 

All the 3D game assets are created using the Blender software.
 
 
============================================================================

This project is created as a part of my thesis.
