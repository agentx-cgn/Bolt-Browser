import { IAction } from './interfaces';

/* The objective of this queue is to send packets in turns to avoid GATT error */
export class Queue {

  private running: boolean;
  private queue:   IAction[];

	constructor () {
		this.running = false;
		this.queue = [];
	}

	/*  Write a command on a specific characteristic */
	async write ( action: IAction, callback:any ) {

		try {
			await action.charac.writeValue(new Uint8Array(action.command));
			console.log(action.bolt.name, action.name, action.command);

		} catch(error) { 
			console.log(error.message);	
		
		} finally {
			callback && callback();

		}

	}

	runCommand (action: IAction) {

		this.running = true;

		this.write( action, () => {

			this.running = false;

			if (this.queue.length > 0) {
				this.runCommand(this.queue.shift());
			}

		});

	}

	append (action: IAction) {
		!this.running ? this.runCommand(action) : this.queue.push(action);
	}

}