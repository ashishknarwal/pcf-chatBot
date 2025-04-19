import * as React from 'react';

export interface IChatComponentProps {
    apiKey: string;
    userInput: string;
    botResponse: string;
    onResponseReceived: (response: string) => void;
}

interface ChatMessage {
    role: string;
    content: string;
    timestamp: Date;
}

export const ChatComponent: React.FC<IChatComponentProps> = (props) => {
    const [messages, setMessages] = React.useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        // Scroll to bottom whenever messages change
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    React.useEffect(() => {
        if (props.userInput && props.userInput.trim() !== "" && props.apiKey) {
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            
            // Only send if this is a new message (not already in the chat)
            if (!lastMessage || 
                lastMessage.role !== "user" || 
                lastMessage.content !== props.userInput) {
                sendMessageToChatGPT(props.userInput);
            }
        }
    }, [props.userInput, props.apiKey]);

    const sendMessageToChatGPT = async (message: string) => {
        if (!props.apiKey) {
            setError("API key is not configured. Please provide an OpenAI API key.");
            return;
        }

        setIsLoading(true);
        setError(null);
        
        // Add user message to chat
        const userMessage: ChatMessage = {
            role: "user", 
            content: message,
            timestamp: new Date()
        };
        
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        
        try {
            const endpoint = "https://api.openai.com/v1/chat/completions";
            const headers = {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${props.apiKey}`
            };
            
            const body = {
                model: "gpt-4o-mini",
                messages: updatedMessages.map(m => ({role: m.role, content: m.content}))
            };
            
            const response = await fetch(endpoint, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(body)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }
            
            const data = await response.json();
            const botResponse = data.choices[0].message.content;
            
            // Add bot response to chat
            const botMessage: ChatMessage = {
                role: "assistant",
                content: botResponse,
                timestamp: new Date()
            };
            
            setMessages([...updatedMessages, botMessage]);
            props.onResponseReceived(botResponse);
        } catch (error) {
            console.error("Error calling ChatGPT API:", error);
            setError(error instanceof Error ? error.message : "Unknown error occurred");
            props.onResponseReceived("Sorry, I encountered an error processing your request.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="llm-chatbot-container">
            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="empty-state">
                        <p>Send a message to start chatting with ChatGPT.</p>
                    </div>
                )}
                
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div className="message-header">
                            <span className="message-sender">
                                {msg.role === "user" ? "You" : "ChatGPT"}
                            </span>
                            <span className="message-time">
                                {msg.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="message-content">{msg.content}</div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="message assistant loading">
                        <div className="message-header">
                            <span className="message-sender">ChatGPT</span>
                        </div>
                        <div className="message-content">
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="error-message">
                        <p>Error: {error}</p>
                    </div>
                )}
                
                <div ref={messagesEndRef} />
            </div>
        </div>
    );
};
