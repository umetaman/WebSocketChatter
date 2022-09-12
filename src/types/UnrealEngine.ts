export interface IClusterEventMessageJson {
    Name: string,
    Type: string,
    Category: string,
    SystemEvent: boolean,
    ShouldDiscardOnRepeat: boolean,
    Parameters: {[key: string]: any}
}

export function parseLineToParameters(words: string[]) : {[key: string]: any} {
    if(words.length < 1){
        console.error("[parseLineToParameters] Empty")
        return {}
    }

    const parameters: {[key: string]: any} = {}
    for(let i = 0; i < words.length; i += 2){
        if(words.length - i < 2) {
            break;
        }

        try{
            parameters[words[i]] = words[i + 1]
        }
        catch(e) {
            console.error(e)
        }
    }

    return parameters
}