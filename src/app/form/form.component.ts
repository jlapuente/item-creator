import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

export interface BaseFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox';
  placeholder?: string;
  description?: string;  // Texto de ayuda para el usuario
  defaultValue?: any;
  validators?: any[];
  options?: { label: string; value: any }[];  // Para campos tipo select
  colClass?: string;  // Clase de columna Bootstrap (por defecto 'col-sm-6')
  readonly?: boolean;
  disabled?: boolean;
  required?: boolean;
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

  /** Campos base del formulario (siempre visibles) */
  coreFields: BaseFieldConfig[] = [
    { name: 'fileName', label: 'Nombre del fichero', type: 'text', placeholder: 'Se genera automáticamente', readonly: true, disabled: true, colClass: 'col-sm-12' },
    { name: 'itemName', label: 'Nombre del item', type: 'text', placeholder: 'Nombre del item', required: true, colClass: 'col-sm-6', validators: [Validators.required] },
    { name: 'isQuestItem', label: '¿Es item de misión?', type: 'checkbox', defaultValue: false, colClass: 'col-sm-6' },
    { name: 'itemDescription', label: 'Descripción del item', type: 'textarea', placeholder: 'Descripción del item', required: true, colClass: 'col-sm-12', validators: [Validators.required] },
    { name: 'model', label: 'Modelo', type: 'text', placeholder: 'Modelo', colClass: 'col-sm-6' },
    { name: 'skin', label: 'Skin', type: 'text', placeholder: 'Skin', colClass: 'col-sm-6', description: 'Algunos modelos tienen submodelos propios, "skins"' },
    { name: 'height', label: 'Altura', type: 'number', placeholder: 'Altura', defaultValue: 1, colClass: 'col-sm-6', description: 'Altura del item en el inventario. Por defecto 1.' },
    { name: 'width', label: 'Anchura', type: 'number', placeholder: 'Anchura', defaultValue: 1, colClass: 'col-sm-6', description: 'Anchura del item en el inventario. Por defecto 1.' },
  ];

  /** Campos que aparecen después de la sección dinámica (base + categoría + appendix) */
  appendixFields: BaseFieldConfig[] = [
    { name: 'redAppendix', label: 'Apéndice rojo', type: 'text', placeholder: 'Apéndice rojo', colClass: 'col-sm-12', description: 'Texto que se muestra en rojo debajo del objeto. SUELE usarse para información OOC o administrativa.' },
    { name: 'greenAppendix', label: 'Apéndice verde', type: 'text', placeholder: 'Apéndice verde', colClass: 'col-sm-12', description: 'Texto que se muestra en verde debajo del objeto. SUELE usarse para información IC.' },
    { name: 'blueAppendix', label: 'Apéndice azul', type: 'text', placeholder: 'Apéndice azul', colClass: 'col-sm-12', description: 'Texto que se muestra en azul debajo del objeto. SUELE usarse para información IC.' },
  ];

  /** Campo selector de base (se renderiza aparte por su lógica especial) */
  baseField: BaseFieldConfig = { name: 'base', label: 'Base', type: 'select', options: [], colClass: 'col-sm-6', description: 'El arquetipo que usará el item como referencia. Determina el comportamiento del item in game.' };
  categoryField: BaseFieldConfig = { name: 'category', label: 'Categoría', type: 'text', placeholder: 'Categoría del item', colClass: 'col-sm-6', description: 'El apartado de la Q > Items en el que aparece. Por defecto, el nombre de su base.' };

  /** Opciones disponibles para el selector 'base'. */
  baseOptions: BaseOption[] = [
    {
      label: 'Comida',
      value: 'food',
      fields: [
        { name: 'hunger', label: 'Hambre', type: 'number', placeholder: 'Cantidad de hambre que restaura', defaultValue: 0, colClass: 'col-sm-3' },
        { name: 'thirst', label: 'Sed', type: 'number', placeholder: 'Cantidad de sed que restaura', defaultValue: 0, colClass: 'col-sm-3' },
        { name: 'health', label: 'Curación', type: 'number', placeholder: 'Cantidad de curación', defaultValue: 0, colClass: 'col-sm-3' },
        { name: 'damage', label: 'Daño a la salud', type: 'number', placeholder: 'Daño a la salud', defaultValue: 0, colClass: 'col-sm-3' },
        { name: 'spoilTime', label: 'Tiempo en dias para caducar', type: 'number', placeholder: 'Tiempo de caducidad', defaultValue: 0, colClass: 'col-sm-3' },
        { name: 'maxStackSize', label: 'Tamaño máximo de stack', type: 'number', placeholder: 'Tamaño máximo de stack', defaultValue: 0, colClass: 'col-sm-3' },
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
      label: 'Documento',
      value: 'document',
      fields: [
        { name: 'docName', label: 'Nombre del documento', type: 'text', placeholder: 'Nombre del documento', colClass: 'col-sm-12', description: 'Ahora mismo este campos no se usa para nada, pero será util mas adelante.' },
        { name: 'docLink', label: 'Link del documento', type: 'text', placeholder: 'Link del documento', colClass: 'col-sm-12', description: 'Se aconseja que al obtener este link, se verifique que acabe en /preview en vez de en /edit para evitar que aparezcan los controles.' },
      ]
    },
    {
      label: 'Rol',
      value: 'rol',
      fields: []
    },
    {
      label: 'Quest item',
      value: 'quest_item',
      fields: []
    },
    {
      label: 'Cantimplora',
      value: 'canteen',
      fields: [
        { name: 'maxWater', label: 'Agua máxima en cl', type: 'number', placeholder: 'Cantidad máxima de agua', defaultValue: 0, colClass: 'col-sm-6' },
      ]
    },
    {
      label: 'Médico',
      value: 'medical',
      fields: [
        { name: 'usableInCombat', label: '¿Es usable en combate?', type: 'checkbox', defaultValue: false, colClass: 'col-sm-6' },
        { name: 'maxStackSize', label: 'Tamaño máximo de stack', type: 'number', placeholder: 'Tamaño máximo de stack', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'healing', label: 'Curación', type: 'number', placeholder: 'Cantidad de curación', defaultValue: 0, colClass: 'col-sm-6' },
        { name: 'useSound', label: 'Sonido de uso', type: 'text', placeholder: 'Ruta del sonido de uso', colClass: 'col-sm-6' },
        { name: 'functions.use.icon', label: 'Icono de uso', type: 'text', placeholder: 'Icono de la función de uso', colClass: 'col-sm-6', description: 'El icono que se muestra en la función de usar, si no conoces como funciona mejor dejalo vacio.' },
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
    // Construir las opciones del selector de base a partir de baseOptions
    this.baseField.options = [
      { label: '-- Selecciona una base --', value: '' },
      ...this.baseOptions.map(opt => ({ label: opt.label, value: opt.value }))
    ];

    // Construir el FormGroup dinámicamente a partir de las configs
    const controls: Record<string, any> = {};
    const allStaticFields = [...this.coreFields, this.baseField, this.categoryField, ...this.appendixFields];

    allStaticFields.forEach(field => {
      const value = field.defaultValue ?? '';
      const validators = field.validators ?? [];
      if (field.disabled) {
        controls[field.name] = [{ value, disabled: true }, validators];
      } else {
        controls[field.name] = [value, validators];
      }
    });

    this.itemForm = this.fb.group(controls);
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

    // Actualizar luaContent cada vez que cambie cualquier campo
    this.itemForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.generateLuaContent();
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

    // Regenerar Lua con los nuevos campos
    this.generateLuaContent();
  }

  /** Campos que no se incluyen en la salida Lua (internos del formulario) */
  private readonly excludedFields = new Set(['fileName', 'base', 'redAppendix', 'greenAppendix', 'blueAppendix']);

  /** Genera el contenido Lua dinámicamente a partir de todos los campos del formulario */
  generateLuaContent(): void {
    this.formValues = this.itemForm.getRawValue();
    const lines: string[] = [];

    for (const [key, value] of Object.entries(this.formValues)) {
      if (this.excludedFields.has(key)) {
        continue;
      }

      if (typeof value === 'boolean') {
        lines.push(`ITEM.${key} = ${value}`);
      } else if (typeof value === 'number') {
        lines.push(`ITEM.${key} = ${value}`);
      } else {
        lines.push(`ITEM.${key} = "${value}"`);
      }
    }

    // colorAppendix se construye manualmente
    lines.push(`ITEM.colorAppendix = {`);
    lines.push(`  ["red"] = "${this.formValues.redAppendix}",`);
    lines.push(`  ["green"] = "${this.formValues.greenAppendix}",`);
    lines.push(`  ["blue"] = "${this.formValues.blueAppendix}"`);
    lines.push(`}`);

    this.luaContent = lines.join('\n');
  }

  onSubmit(): void {
    if (this.itemForm.valid) {
      this.generateLuaContent();
      this.downloadFile(this.luaContent, this.itemForm.getRawValue().fileName);
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