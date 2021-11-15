 
 
 
export interface ElementLike {

    ownerDocument?: ElementLike;

    clientHeight: number;

    clientWidth: number;

    removeEventListener(type: string, callback: Function, isTrue: boolean): void;

    addEventListener(type: string, callback: Function, isTrue: boolean): void;

    dispatchEvent(event: Event): void;

} 

export class ElementListener implements ElementLike {

    clientHeight: number = 500;
    clientWidth: number = 500;

    private map: Map<string, Function>;

    constructor(public ownerDocument?: ElementLike) {
        this.map = new Map<string, Function>();
    }

    removeEventListener(type: string, callback: Function, isTrue: boolean): void {
        this.map.delete(type); 
    }

    addEventListener(type: string, callback: Function, isTrue: boolean): void {
        this.map.set(type, callback); 
    }

    dispatchEvent(event: Event): void { 
        if(!this.map.has(event.type)) return;
        this.map.get(event.type)(event); 
    }

}
