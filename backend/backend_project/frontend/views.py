from django.shortcuts import render
from django.http import JsonResponse
from db_scripts import library_api

def search_books(request):
    # results = library_api.search_books(search_query="python")  (example)
    return JsonResponse(results)


# Create your views here.
def home(request):
    return render(request, 'frontend/index.html')

def books(request):
    return render(request, 'frontend/pages/books.html')

def add_edit(request):
    return render(request, 'frontend/pages/add_edit.html')

def admin_dashboard(request):
    return render(request, 'frontend/pages/admin_dashboard.html')

def book_details(request):
    return render(request, 'frontend/pages/book_details.html')

def borrowed(request):
    return render(request, 'frontend/pages/borrowed.html')

def profile(request):
    return render(request, 'frontend/pages/profile.html')

def sign_in(request):
    return render(request, 'frontend/pages/sign-in.html')

def sign_up(request):
    return render(request, 'frontend/pages/sign-up.html')

def user_dashboard(request):
    return render(request, 'frontend/pages/user_dashboard.html')