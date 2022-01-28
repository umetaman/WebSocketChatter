<template>
    <div class="chatter-container">
        <div class="ws-connection">
            <input
                v-model="address"
                type="text"
                name="ws-address"
                id="ws-address"
            />
            <button id="ws-connect-btn" @click="onClickConnect">Connect</button>
        </div>
        <div class="ws-state-container">
            <span :class="[connectionState.class, 'ws-state']">
                {{ connectionState.message }}
            </span>
        </div>
        <textarea
            v-model="message"
            name="ws-message"
            id="ws-message"
            cols="60"
            rows="10"
            @drop.prevent="onDroppedJsonFile"
        ></textarea>
        <button id="ws-send-btn" @click="onClickSend">Send</button>
    </div>
</template>

<script lang="ts">
import { computed, ref } from 'vue'

export default {
    setup() {
        const address = ref<string>('')
        const message = ref<string>('')
        const websocket = ref<WebSocket | null>(null)

        function openWebSocket(address: string) {
            if (websocket.value !== null) {
                websocket.value.close()
                websocket.value = null
            }

            websocket.value = new WebSocket(address)
            websocket.value.onmessage = onMessage
            websocket.value.onopen = onOpen
            websocket.value.onclose = onClose
        }

        function onOpen(event: Event) {
            console.log('WebSocket is opened.')
        }

        function onMessage(event: MessageEvent) {
            console.log(event.data)
        }

        function onClose(event: CloseEvent) {
            websocket.value = null
        }

        function sendMessage(message: string) {
            try {
                if (websocket.value !== null) {
                    // JSON.parse(message)
                    console.log(message)
                    websocket.value.send(message)
                } else {
                    console.error('WebSocket is not connected.')
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
        const onClickConnect = () => {
            if (address.value.startsWith('ws://')) {
                openWebSocket(address.value)
            } else {
                console.error('Invalid Url.')
            }
        }
        const onClickSend = () => {
            sendMessage(message.value)
        }

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

        return {
            address,
            message,
            connectionState,
            onClickConnect,
            onClickSend,
            onDroppedJsonFile,
        }
    },
}
</script>

<style lang="scss" scoped>
@import url('./assets/common.scss');

div.chatter-container {
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
}

div.ws-connection {
    display: flex;
    margin-bottom: 1rem;
}

div.ws-state-container {
    margin-bottom: 2rem;

    span.ws-disconnected {
        color: #ff0000;
    }

    span.ws-connecting {
        color: #00aa00;
    }
}

button {
    padding: 0.5rem 1rem;
    background-color: #ffaaaa;
    border-radius: 0.35rem;
    width: fit-content;
}

input[type='text'],
textarea {
    border: 1px solid #999999;
    border-radius: 0.35rem;
    padding: 0.5rem;
}

input#ws-address {
    margin-right: 1rem;
}

textarea#ws-message {
    margin-bottom: 1rem;
}
</style>
