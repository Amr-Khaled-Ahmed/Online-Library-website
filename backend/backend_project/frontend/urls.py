from django.urls import path
from django.contrib.auth.views import LogoutView
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('add-edit', views.add_edit, name='add_edit'),
    path('admin-dashboard', views.admin_dashboard, name='admin_dashboard'),
    path('books', views.books, name='books'),
    path('book-details', views.book_details, name='book_details'),
    path('borrowed', views.borrowed, name='borrowed'),
    path('profile', views.profile, name='profile'),
    path('sign-in', views.sign_in, name='sign_in'),
    path('sign-up', views.sign_up, name='sign_up'),
    path('user-dashboard', views.user_dashboard, name='user_dashboard'),
    path('logout', LogoutView.as_view(next_page='home'), name='logout'),  # Add this line

    # path('about', views.about, name='about'),
]