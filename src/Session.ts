class Action {
    type: string = "action";
}
class PlayAction extends Action {
    type: string = "play";
    sound: string;

    constructor(raw: string, sounds: Record<string, string>){
        super();
        this.type = "play";
        const argv = raw.split(" ").slice(1);
        this.sound = argv[0] in sounds ? sounds[argv[0]] : "";
        if(this.sound == ""){
            console.warn(`Sound ${argv[0]} not found`);
        }
    }
}
class TimeAction extends Action {
    type: string = "time";
    duration: number;
    color: string;
    text: string;

    constructor(raw: string){
        super();
        this.type = "time";
        const argv = raw.split(" ").slice(1);
        this.duration = parseFloat(argv[0]);
        this.color = argv[1];
        this.text = argv.slice(2).join(" ");
    }
}
class WaitAction extends Action {
    type: string = "wait";
    duration: number;

    constructor(raw: string) {
        super();
        this.type = "wait";
        const argv = raw.split(" ").slice(1);
        this.duration = parseFloat(argv[0]);
    }
}
class DisplayAction extends Action {
    type: string = "display";
    color: string;
    text: string;

    constructor(raw: string) {
        super();
        this.type = "display";
        const argv = raw.split(" ").slice(1);
        this.color = argv[0];
        this.text = argv[1];
    }
}

interface SequenceDict {
    [key: string]: Action[];
}

class Session {
    sequence: Action[];

    constructor(config: any, sounds: Record<string, string>){
        const macros: SequenceDict = {}

        function parseSequence(raw_macro: string[]): Action[]{
            return raw_macro.map((raw_action: string) => {
                if (raw_action.startsWith("play")) {
                    return new PlayAction(raw_action, sounds);
                } else if (raw_action.startsWith("time")) {
                    return new TimeAction(raw_action);
                } else if (raw_action.startsWith("wait")) {
                    return new WaitAction(raw_action);
                } else if (raw_action.startsWith("display")) {
                    return new DisplayAction(raw_action);
                } else if (raw_action in macros) {
                    return macros[raw_action];
                } else {
                    throw new Error(`Unknown action type: ${raw_action}`);
                }
            }).flat();
        }
        
        for (const [name, raw_macro] of Object.entries(config.macros as Record<string, string[]>)) {
            macros[name] = parseSequence(raw_macro);
        }
        this.sequence = parseSequence(config.sequence);
    }
}

export default Session;
export { Action, PlayAction, TimeAction, WaitAction, DisplayAction };
