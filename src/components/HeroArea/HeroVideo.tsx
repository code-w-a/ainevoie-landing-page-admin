import FsLightbox from "fslightbox-react";
import { createPortal } from "react-dom";

export default function VideoModal({ toggler }: { toggler: boolean }) {
    return createPortal(<FsLightbox
        toggler={toggler}
        sources={[
            "https://www.youtube.com/watch?v=HXHphpDJ9T0&pp=ygULaW50cm8gdmlkZW8%3D",
        ]}
    />, document.body)
}