<template>
    <div class="console-container">
        <p class="text-buffer">
            <span class="text-buffer-line" v-for="line in bufferLines" v-text="line"></span>
        </p>
        <div class="console-input-container">
            <span class="console-input">
                <input type="text" name="prompt" id="prompt" v-model="inputPrompt" @keydown.enter.prevent="onEnterPrompt">
            </span>
            <span class="console-input">
                <label>SystemEvent: <input v-model="isSystemEvent" type="checkbox" name="system-event" id="checkbox-system-event"></label>
                <label>DiscardOnRepeat: <input v-model="discardOnRepeat" type="checkbox" name="discard-repeat" id="checkbox-discard-repeat"></label>
            </span>
        </div>
    </div>
</template>

<script lang="ts">
import { computed, onMounted, ref } from 'vue'
import { IClusterEventMessageJson, parseLineToParameters } from "../types/UnrealEngine"
const WS_PORT = 5678
const WS_URL = `ws://localhost:${WS_PORT}`

export default {
    setup() {
        const address = ref<string>('')
        const message = ref<string>('')
        const websocket = ref<WebSocket | null>(null)
        const bufferLines = ref<string[]>([])
        const histories = ref<string[]>([])
        const historyIndex = ref<number>(0)
        const inputPrompt = ref<string>("")
        const isSystemEvent = ref<boolean>(true)
        const discardOnRepeat = ref<boolean>(false)

        function bufferWriteLine(line: string){
            bufferLines.value.push(line)
        }

        function openWebSocket(address: string) {
            if (websocket.value !== null) {
                websocket.value.close()
                websocket.value = null
            }

            websocket.value = new WebSocket(address)
            websocket.value.onmessage = onMessage
            websocket.value.onopen = onOpen
            websocket.value.onclose = onClose
            websocket.value.onerror = onError

            bufferWriteLine(`[WebSocket] Connect to ${address} ...`)
        }

        function onOpen(event: Event) {
            bufferWriteLine("[WebSocket] Succeeded to connect to " + WS_URL)
        }

        function onMessage(event: MessageEvent) {
            console.log(event.data)
            bufferWriteLine(`[WebSocket] OnMessage: ${event.data}`)
        }

        function onClose(event: CloseEvent) {
            websocket.value = null
            bufferWriteLine("[WebSocket] Closed.");
        }

        function onError(event: Event) {
            bufferWriteLine(`[WebSocket] Error.`);
        }

        function sendMessage(message: string) {
            try {
                if (websocket.value !== null) {
                    console.log(message)
                    websocket.value.send(message)
                    bufferWriteLine("[WebSocket] Send: " + message)
                } else {
                    bufferWriteLine("[WebSocket] Not Connected.")
                }
            } catch (e) {
                console.error(e)
            }
        }

        const connectionState = computed(() => {
            if (websocket.value !== null) {
                return {
                    class: 'ws-connecting',
                    message: 'Connected.',
                }
            } else {
                return {
                    class: 'ws-disconnected',
                    message: 'Disconnected.',
                }
            }
        })

        const onDroppedJsonFile = async (event: DragEvent) => {
            event.preventDefault()

            try {
                if (event.dataTransfer !== undefined) {
                    const transfer: DataTransfer =
                        event.dataTransfer as DataTransfer
                    for (let i = 0; i < transfer.files.length; i++) {
                        const content = (await transfer.files
                            .item(i)
                            ?.text()) as string

                        message.value = content
                    }
                }
            } catch (e) {
                console.log(e)
            }
        }

        const createClusterEvent = (parameters: {[key: string]: any}) => {
            const event: IClusterEventMessageJson = {
                Name: "_Command",
                Type: "",
                Category: "",
                SystemEvent: isSystemEvent.value,
                ShouldDiscardOnRepeat: discardOnRepeat.value,
                Parameters: parameters
            }

            return event
        }

        const createSendTcpMessage = (data: IClusterEventMessageJson) => {
            return {
                command: "SendTCP",
                data: data
            }
        }

        const onEnterPrompt = () => {
            if(!inputPrompt.value){
                return
            }

            const words = inputPrompt.value.replaceAll("　", " ").split(" ");
            if(words.length < 2) {
                return
            }
            
            const firstCommand = words[0].toLowerCase()
            words.shift()
            switch(firstCommand) {
                case "connect": {
                    const parameters = parseLineToParameters(words)
                    parameters["command"] = "ConnectTCP"
                    sendMessage(JSON.stringify(parameters))
                    break;
                }
                case "send": {
                    const parameters = parseLineToParameters(words)
                    const data = createClusterEvent(parameters)
                    const sendTcpMessage = createSendTcpMessage(data)
                    sendMessage(JSON.stringify(sendTcpMessage))
                    break;
                }
            }
            
            if(histories.value.includes(inputPrompt.value) == false){
                histories.value.push(inputPrompt.value)
                bufferLines.value.push(`> ${inputPrompt.value}`)
            }

            inputPrompt.value = ""
        }

        const onKeyDown = (e: KeyboardEvent) => {
            switch(e.code) {
                case "ArrowUp":
                    if(histories.value.length == 0){
                        historyIndex.value = 0;
                        break;
                    }
                    historyIndex.value = historyIndex.value - 1
                    break;
                case "ArrowDown":
                    if(histories.value.length == 0){
                        historyIndex.value = 0;
                        break;
                    }
                    historyIndex.value = historyIndex.value + 1
                    break;
            }

            if(e.code === "ArrowUp" || e.code === "ArrowDown"){
                historyIndex.value = Math.max(historyIndex.value, 0)
                historyIndex.value = Math.min(historyIndex.value, histories.value.length - 1)
                inputPrompt.value = histories.value[historyIndex.value]
            }
        }

        onMounted(() => {
            openWebSocket(WS_URL)
            window.onkeydown = onKeyDown
            document.title = "nDisplay Console"
        })

        return {
            address,
            message,
            bufferLines,
            inputPrompt,
            connectionState,
            onDroppedJsonFile,
            onEnterPrompt,
            isSystemEvent,
            discardOnRepeat
        }
    },
}
</script>

<style lang="scss" scoped>
@import url('../assets/common.scss');

div.console-container {
    margin: 0;
    padding: 1rem;
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: end;
}

p.text-buffer {
    width: 100%;
    height: 100%;
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    justify-content: end;
    
    > span.text-buffer-line {
        margin-bottom: 0.75rem;
    }
}

input#prompt[type="text"] {
    padding: 1rem;
    margin-bottom: 1rem;
    width: 100%;
    height: 1rem;
    border: 2px solid #dddddd;
    background-color: yellow;
    border-radius: 0.25rem;
}

input[type="checkbox"] {
    margin-right: 1rem;;
    width: 1.5rem;
    height: 1.5rem;
    vertical-align: middle;

    border: 2px solid #dddddd;
    border-radius: 0.25rem;

    &:checked {
        background: red;
        border-radius: 0.25rem;
    }
}
</style>
