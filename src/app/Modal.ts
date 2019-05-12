import { ModalService } from './modal.service';

export class Modal {
    visible: boolean;

    constructor(private modalService: ModalService) {
        
    }

    show() {
        this.visible = true;
    }

    hide() {
        this.visible = false;
        this.modalService.hideModal();
    }
}
