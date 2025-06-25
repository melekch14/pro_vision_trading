import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: false
})
export class RegisterComponent {
  user = {
    raisonSociale: '',
    email: '',
    password: '',
    responsable: '',
    phone: '',
    adresse: '',
    rccm: '',
    ninea: '',
    code_douane: ''
  };

  submitted = false;
  registrationError = '';
  registrationSuccess = '';
  generatedCode = '';

  constructor(private router: Router, private authService: AuthService) {}

  onSubmit(form: NgForm) {
    this.submitted = true;
    this.registrationError = '';
    this.registrationSuccess = '';
    this.generatedCode = '';

    if (form.valid) {
      const payload = {
        raison_social: this.user.raisonSociale,
        email: this.user.email,
        password: this.user.password,
        responsable: this.user.responsable,
        tel: this.user.phone,
        adresse: this.user.adresse,
        rccm: this.user.rccm,
        ninea: this.user.ninea,
        code_douane: this.user.code_douane
      };

      this.authService.registerClient(payload).subscribe({
        next: (response: any) => {
          if (response.codee) {
            this.generatedCode = response.codee;
            this.registrationSuccess = `Inscription réussie ! Votre code client est : ${response.codee}`;
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 3000);
          } else {
            this.router.navigate(['/login']);
          }
        },
        error: (err) => {
          this.registrationError = err.error?.message || "Échec de l'inscription";
        }
      });
    }
  }
}
