import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export interface BaseFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  defaultValue?: any;
  validators?: any[];
  options?: { label: string; value: any }[];  // Para campos tipo select
  colClass?: string;  // Clase de columna Bootstrap (por defecto 'col-sm-6')
}

export interface BaseOption {
  label: string;
  value: string;
  fields: BaseFieldConfig[];
}

@Component({
  selector: 'app-form',
  templateUrl: './form.component.html',
  styleUrls: ['./form.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule]
})
export class ContactFormComponent implements OnInit, OnDestroy {
  itemForm: FormGroup;
  luaContent!: string;
  formValues: any;

  /** Opciones disponibles para el selector 'base'. */
  baseOptions: BaseOption[] = [
    {
      label: 'Comida',
      value: 'food',
      fields: [
        { name: 'hunger', label: 'Hambre', type: 'number', placeholder: 'Cantidad de hambre que restaura', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'thirst', label: 'Sed', type: 'number', placeholder: 'Cantidad de sed que restaura', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'health', label: 'Curación', type: 'number', placeholder: 'Cantidad de curación', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'damage', label: 'Daño a la salud', type: 'number', placeholder: 'Daño a la salud', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'spoilTime', label: 'Tiempo de caducidad', type: 'number', placeholder: 'Tiempo de caducidad', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'maxStackSize', label: 'Tamaño máximo de stack', type: 'number', placeholder: 'Tamaño máximo de stack', defaultValue: 0, colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Herramienta',
      value: 'tool',
      fields: [
        { name: 'maxDurability', label: 'Durabilidad máxima', type: 'number', placeholder: 'Durabilidad máxima', defaultValue: 0, colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Casete',
      value: 'casette',
      fields: [
        { name: 'music', label: 'Música', type: 'text', placeholder: 'Nombre de la música', colClass: 'col-sm-6' },
        { name: 'cover', label: 'Portada', type: 'text', placeholder: 'Portada del casete', colClass: 'col-sm-6' },
        { name: 'author', label: 'Autor', type: 'text', placeholder: 'Autor de la música', colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Rol',
      value: 'rol',
      fields: []
    },
    {
      label: 'Cantimplora',
      value: 'canteen',
      fields: [
        { name: 'maxWater', label: 'Agua máxima', type: 'number', placeholder: 'Cantidad máxima de agua', defaultValue: 0, colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Médico',
      value: 'medical',
      fields: [
        { name: 'usableInCombat', label: 'Usable en combate', type: 'checkbox', defaultValue: false, colClass: 'col-sm-6' },
        { name: 'maxStackSize', label: 'Tamaño máximo de stack', type: 'number', placeholder: 'Tamaño máximo de stack', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'healing', label: 'Curación', type: 'number', placeholder: 'Cantidad de curación', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'useSound', label: 'Sonido de uso', type: 'text', placeholder: 'Ruta del sonido de uso', colClass: 'col-sm-6' },
        { name: 'functions.use.icon', label: 'Icono de uso', type: 'text', placeholder: 'Icono de la función de uso', colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Medicina',
      value: 'medicine',
      fields: [
        { name: 'medicine', label: 'Medicina', type: 'text', placeholder: 'Nombre de la medicina', colClass: 'col-sm-6' },
      ]
    },
  ];

  /** Campos dinámicos activos según la base seleccionada */
  activeBaseFields: BaseFieldConfig[] = [];

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly fb: FormBuilder) {
    this.itemForm = this.fb.group({
      fileName: [{ value: '', disabled: true }],
      itemName: ['', Validators.required],
      itemDescription: ['', Validators.required],
      model: [''],
      skin: [''],
      height: [1],
      width: [1],
      isForMission: [false],
      base: [''],
      category: [''],
      redAppendix: [''],
      greenAppendix: [''],
      blueAppendix: ['']
    });
  }

  ngOnInit(): void {
    this.itemForm.get('base')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((selectedBase: string) => {
        this.onBaseChange(selectedBase);
      });

    this.itemForm.get('itemName')!.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((itemName: string) => {
        const sanitized = (itemName || '').toLowerCase().replace(/\s+/g, '_');
        this.itemForm.get('fileName')!.setValue(`sh_${sanitized}.lua`, { emitEvent: false });
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Elimina los campos dinámicos anteriores y añade los nuevos según la base seleccionada */
  private onBaseChange(selectedBase: string): void {
    // Eliminar campos dinámicos anteriores
    this.activeBaseFields.forEach(field => {
      if (this.itemForm.contains(field.name)) {
        this.itemForm.removeControl(field.name);
      }
    });

    // Buscar la configuración de la nueva base
    const baseOption = this.baseOptions.find(opt => opt.value === selectedBase);
    this.activeBaseFields = baseOption ? baseOption.fields : [];

    // Actualizar la categoría con el label de la base seleccionada
    this.itemForm.get('category')!.setValue(baseOption ? baseOption.label : '');

    // Añadir los nuevos campos dinámicos al formulario
    this.activeBaseFields.forEach(field => {
      this.itemForm.addControl(
        field.name,
        this.fb.control(field.defaultValue ?? '', field.validators ?? [])
      );
    });
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      // Obtener los valores del formulario (getRawValue incluye campos disabled)
      this.formValues = this.itemForm.getRawValue();
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
      this.downloadFile(this.luaContent, this.formValues.fileName);
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