import Dragger from "antd/es/upload/Dragger";
import {InboxOutlined} from "@ant-design/icons";
import {Button, type UploadFile, type UploadProps} from "antd";
import {useState, useEffect, type SetStateAction, type Dispatch} from "react";
import Ajv from "ajv";

import Session from "./Session.ts";

function Onboard({setSession}: {setSession: Dispatch<SetStateAction<Session | undefined>>}) {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [ajv, setAjv] = useState<Ajv | null>(null);

    useEffect(() => {
        fetch('/timer.schema.json')
            .then(response => response.json())
            .then(schema => {
                const ajvInstance = new Ajv();
                ajvInstance.addSchema(schema, 'timer');
                setAjv(ajvInstance);
            })
            .catch(error => {
                console.error('Failed to load schema:', error);
            });
    }, []);

    const upload_props: UploadProps = {
        name: 'file',
        multiple: true,
        fileList: fileList,

        beforeUpload() {
            return false;
        },
        onChange(info){
            console.log("onChange", info);
            console.log("fileList", fileList);

            const newFiles = info.fileList.filter(file => file.status === undefined);

            if(newFiles.length === 0) return;

            const newFileList = [...fileList];

            newFiles.forEach(newFile => {
                if(newFile == undefined){
                    alert("New file is somehow undefined");
                    return;
                }

                if (newFile.type?.startsWith("audio/")) {
                    if (newFile.originFileObj) {
                        newFileList.forEach(file => {
                            if (file.type?.startsWith("audio/") && file.name === newFile.name) {
                                file.status = "error";
                            }
                        });

                        const audioUrl = URL.createObjectURL(newFile.originFileObj);
                        const audio = new Audio(audioUrl);
                        audio.addEventListener('error', () => {
                            newFile.status = "error";
                            URL.revokeObjectURL(audioUrl);

                            newFileList.push(newFile);
                            setFileList([...newFileList]);
                        });
                        audio.addEventListener('canplay', () => {
                            //URL.revokeObjectURL(audioUrl);
                            newFile.status = "done";
                            newFile.response = audioUrl;

                            newFileList.push(newFile);
                            setFileList([...newFileList]);
                        });
                        return;
                    }
                }else if(newFile.type == "application/json"){
                    if (newFile.originFileObj && ajv) {
                        const reader = new FileReader();
                        reader.readAsText(newFile.originFileObj);
                        reader.onloadend = () => {
                            try {
                                const json = JSON.parse(reader.result as string);
                                const validate = ajv.getSchema('timer');
                                if (validate && validate(json)) {
                                    newFile.status = "done";
                                    newFile.response = json;

                                    newFileList.forEach(file => {
                                        if (file.type === "application/json") {
                                            file.status = "error";
                                        }
                                    });
                                } else {
                                    console.log("Didn't validate");
                                    newFile.status = "error";
                                }
                            } catch (error) {
                                console.log(error);
                                newFile.status = "error";
                            }
                            newFileList.push(newFile);
                            setFileList([...newFileList]);
                        };
                        return;
                    } else {
                        newFile.status = "error";
                    }
                }else{
                    newFile.status = "error";
                }

                newFileList.push(newFile);
                setFileList([...newFileList]);
            });
        },
        onRemove(file){
            setFileList(fileList.filter((item) => {
                return item != file;
            }))
        }
    };

    const hasConfig = fileList.some(file => file.type === "application/json" && file.status === "done");

    const handleGo = () => {
        if(!hasConfig) return;
        const config = fileList.find(file => file.type === "application/json" && file.status === "done");
        if(!config) return;
        const sounds: Record<string, string> = Object.fromEntries(fileList.filter(file => file.type?.startsWith("audio/") && file.status === "done").map(file => [file.name, file.response]));
        const session = new Session(config.response, sounds);
        console.log(session);
        setSession(session);
    }

    return <>
        <Dragger {...upload_props}>
            <p className="ant-upload-drag-icon">
                <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag files to this area</p>
            <p className="ant-upload-hint">
                Required: <a href="../public/timer.schema.json">.timer.json</a>
            </p>
            <p className="ant-upload-hint">
                Supported extras: .mp3
            </p>
        </Dragger>
        <Button disabled={!hasConfig} onClick={handleGo}>Go</Button>
    </>
}

export default Onboard