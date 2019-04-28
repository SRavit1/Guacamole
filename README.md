# Node.js Web App

This web app was created for the purpose of serving as a cloud-based IDE. Node.js is used to handle requests made by the client to the server. This is the link to the finalized web app: http://178.128.178.46/. Feel free to try out and modify the code!

<a href="http://www.youtube.com/watch?feature=player_embedded&v=krFMRLHh-qE"
target="_blank"> <img src="https://github.com/SRavit1/Node.js-Web-App/blob/master/Web%20App.png" 
alt="Web App" border="10" /></a>

## Architecture

This explorer is a web app that operates using Node.js, which allows the client (browser) to make requests (e.g. GET, POST) to the server. The browser displays the HTML (which uses CSS stylesheet) and runs a script that dynamically responds to the client's requests.

Loading:
	The client needs to access the files on the server's computer, so the buttons are dynamically added to the index.html. Files are copied into a new directory created for the client with a unique ids.

Opening:
	When a button is clicked from the client, a get request is sent to the server and the output is displayed in the workspace.

Saving:
	When the save button is clicked, a post request is sent to the server with the file name and the content in the text file.

Running:
	When the run button is clicked, a get request is sent to the server, and the output is displayed in the workspace.

Exit:
	When the exit button is clicked, a get request is sent to the server, and a new page is loaded after the client's directory is deleted.
