import { Component } from '@angular/core';

@Component({
  selector: 'app-client-profile',
  templateUrl: './client-profile.component.html',
  styleUrls: ['./client-profile.component.css'],
  standalone: false
})
export class ClientProfileComponent {
  user = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    address: '123 Main Street, New York, NY 10001',
    bio: 'Software developer with 5 years of experience in web development.',
    joinDate: 'January 15, 2022'
  };

  editMode = false;
  editedUser = { ...this.user };

  enableEdit() {
    this.editMode = true;
    this.editedUser = { ...this.user };
  }

  saveProfile() {
    this.user = { ...this.editedUser };
    this.editMode = false;
    alert('Profile updated successfully!');
  }

  cancelEdit() {
    this.editMode = false;
    this.editedUser = { ...this.user };
  }

  resetPassword() {
    // Placeholder: In real app, call backend to send email
    alert('A password reset email has been sent to ' + this.user.email);
  }
} 