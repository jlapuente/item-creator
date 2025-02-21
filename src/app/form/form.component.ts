import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class ContactFormComponent {
  itemForm: FormGroup;
  luaContent!: string;
  formValues: any

  constructor(private readonly fb: FormBuilder) {
    this.itemForm = this.fb.group({
      fileName: ['', Validators.required],
      itemName: ['', Validators.required],
      itemDescription: ['', Validators.required],
      model: [''],
      skin: [''],
      height: [1],
      width: [1],
      isForMission: [false],
      redAppendix: [''],
      greenAppendix: [''],
      blueAppendix: ['']
    });
   }

  onSubmit(): void {
    if (this.itemForm.valid) {
      // Obtener los valores del formulario
      this.formValues = this.itemForm.value;
      // Generar el contenido del archivo .lua
      this.luaContent = `
ITEM.name = "${this.formValues.itemName}"
ITEM.description = "${this.formValues.itemDescription}"
ITEM.model = "${this.formValues.model}"
ITEM.width = ${this.formValues.width}
ITEM.height = ${this.formValues.height}
ITEM.isQuestItem = "${this.formValues.isForMission}"
ITEM.colorAppendix = {
  ["red"] = "${this.formValues.redAppendix}",
  ["green"] = "${this.formValues.greenAppendix}",
  ["blue"] = "${this.formValues.blueAppendix}"
}
`.trim();

      // Crear y descargar el archivo .lua
      this.downloadFile(this.luaContent, 'sh_'+this.formValues.fileName + '.lua');
    } else {
      console.log('Form is invalid');
    }
  }

  // Método para crear y descargar el archivo
  downloadFile(content: string, fileName: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);

    // Crear un enlace temporal para descargar el archivo
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    // Limpiar y liberar el objeto URL
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}