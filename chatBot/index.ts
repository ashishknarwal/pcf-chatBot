import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { ChatComponent, IChatComponentProps } from './ChatComponent';

export class LLMChatbot implements ComponentFramework.StandardControl<IInputs, IOutputs> {
    private container: HTMLDivElement;
    private notifyOutputChanged: () => void;
    private props: IChatComponentProps = {
        apiKey: "",
        userInput: "",
        botResponse: "",
        onResponseReceived: this.onResponseReceived.bind(this)
    };

    constructor() {}

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary): void {
        this.notifyOutputChanged = notifyOutputChanged;
        this.container = document.createElement("div");
        
        // Get the API key directly from the property
        this.props.apiKey = context.parameters.apiKey.raw || "";
        this.props.userInput = context.parameters.userInput.raw || "";
        
        this.renderControl();
    }

    private renderControl(): void {
        const root = ReactDOM.createRoot(this.container);
        root.render(React.createElement(ChatComponent, this.props));
        this._root = root;
    }
    
    
    

    public updateView(context: ComponentFramework.Context<IInputs>): void {
        // Update properties from context
        this.props.apiKey = context.parameters.apiKey.raw || "";
        this.props.userInput = context.parameters.userInput.raw || "";
        
        this.renderControl();
    }

    private onResponseReceived(response: string): void {
        this.props.botResponse = response;
        this.notifyOutputChanged();
    }

    public getOutputs(): IOutputs {
        return {
            botResponse: this.props.botResponse
        };
    }

    private _root: ReactDOM.Root | null = null;

    public destroy(): void {
        if (this._root) {
            this._root.unmount();
        }
    }
    
}
