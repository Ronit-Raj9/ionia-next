"""
RBAC Implementation Verification Script
Run this to verify all RBAC components are properly implemented
"""
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent))


def test_imports():
    """Test that all RBAC modules can be imported"""
    print("🧪 Testing RBAC module imports...")
    
    try:
        from app.core.security import JWTValidator, CurrentUser
        from app.core.constants import UserRole, ResponseMessage, ErrorCode
        from app.api.v1.dependencies.supabase_auth import get_current_user
        from app.api.v1.dependencies.role_guard import (
            require_school_admin,
            require_principal,
            require_class_teacher,
            require_teacher,
            require_student,
            require_min_teacher,
            require_min_principal,
            RoleGuard,
            MinimumRoleGuard,
            SchoolAccessGuard
        )
        from app.api.exceptions import (
            AuthenticationException,
            AuthorizationException,
            ForbiddenError,
            SchoolAccessDeniedException,
            RoleHierarchyViolationException
        )
        from app.db.models.user_model import Profile, School, UserRole as ModelUserRole
        
        print("   ✅ All imports successful!")
        return True
    except Exception as e:
        print(f"   ❌ Import failed: {e}")
        return False


def test_user_role_enum():
    """Test UserRole enum functionality"""
    print("\n🧪 Testing UserRole enum...")
    
    try:
        from app.core.constants import UserRole
        
        # Test hierarchy
        hierarchy = UserRole.get_hierarchy()
        assert len(hierarchy) == 5, "Should have 5 roles"
        assert hierarchy[0] == UserRole.STUDENT, "Student should be lowest"
        assert hierarchy[-1] == UserRole.SCHOOL_ADMIN, "School admin should be highest"
        
        # Test role levels
        assert UserRole.STUDENT.get_level() == 0
        assert UserRole.TEACHER.get_level() == 1
        assert UserRole.CLASS_TEACHER.get_level() == 2
        assert UserRole.PRINCIPAL.get_level() == 3
        assert UserRole.SCHOOL_ADMIN.get_level() == 4
        
        # Test hierarchy access
        assert UserRole.can_access(UserRole.PRINCIPAL, UserRole.TEACHER)
        assert not UserRole.can_access(UserRole.STUDENT, UserRole.TEACHER)
        
        print("   ✅ UserRole enum working correctly!")
        return True
    except Exception as e:
        print(f"   ❌ UserRole test failed: {e}")
        return False


def test_current_user_methods():
    """Test CurrentUser helper methods"""
    print("\n🧪 Testing CurrentUser methods...")
    
    try:
        from app.core.security import CurrentUser
        
        # Create mock payload
        payload = {
            "sub": "test-user-123",
            "email": "teacher@test.com",
            "app_metadata": {
                "roles": ["teacher"],
                "school_id": "school-abc"
            },
            "aud": "authenticated",
            "exp": 9999999999
        }
        
        user = CurrentUser(payload)
        
        # Test basic properties
        assert user.user_id == "test-user-123"
        assert user.email == "teacher@test.com"
        assert "teacher" in user.roles
        assert user.school_id == "school-abc"
        
        # Test role checks
        assert user.has_role("teacher")
        assert not user.has_role("principal")
        assert user.has_any_role(["teacher", "principal"])
        assert user.is_teacher()
        assert not user.is_student()
        
        # Test hierarchy
        assert user.get_highest_role_level() == 1
        assert user.meets_minimum_role("teacher")
        assert user.meets_minimum_role("student")
        assert not user.meets_minimum_role("principal")
        
        # Test school access
        assert user.can_access_school("school-abc")
        assert not user.can_access_school("school-xyz")
        
        print("   ✅ CurrentUser methods working correctly!")
        return True
    except Exception as e:
        print(f"   ❌ CurrentUser test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_exceptions():
    """Test custom exceptions"""
    print("\n🧪 Testing custom exceptions...")
    
    try:
        from app.api.exceptions import (
            ForbiddenError,
            SchoolAccessDeniedException,
            RoleHierarchyViolationException
        )
        
        # Test exception creation
        exc1 = ForbiddenError("Test forbidden")
        assert exc1.status_code == 403
        
        exc2 = SchoolAccessDeniedException("school-123")
        assert "school-123" in exc2.message
        
        exc3 = RoleHierarchyViolationException("principal", "teacher")
        assert "principal" in exc3.message
        
        print("   ✅ Custom exceptions working correctly!")
        return True
    except Exception as e:
        print(f"   ❌ Exception test failed: {e}")
        return False


def test_role_guards():
    """Test role guard classes"""
    print("\n🧪 Testing role guard classes...")
    
    try:
        from app.api.v1.dependencies.role_guard import RoleGuard, MinimumRoleGuard
        from app.core.constants import UserRole
        
        # Test RoleGuard creation
        guard = RoleGuard([UserRole.TEACHER, UserRole.PRINCIPAL])
        assert len(guard.allowed_roles) == 2
        
        # Test MinimumRoleGuard creation
        min_guard = MinimumRoleGuard(UserRole.CLASS_TEACHER)
        assert min_guard.min_role == UserRole.CLASS_TEACHER
        
        print("   ✅ Role guards instantiate correctly!")
        return True
    except Exception as e:
        print(f"   ❌ Role guard test failed: {e}")
        return False


def verify_file_structure():
    """Verify all RBAC files exist"""
    print("\n📁 Verifying file structure...")
    
    files = [
        "app/core/security.py",
        "app/core/constants.py",
        "app/api/v1/dependencies/supabase_auth.py",
        "app/api/v1/dependencies/role_guard.py",
        "app/api/exceptions.py",
        "app/db/models/user_model.py",
        ".env.example",
        "RBAC_IMPLEMENTATION.md"
    ]
    
    all_exist = True
    for file in files:
        path = Path(__file__).parent / file
        if path.exists():
            print(f"   ✅ {file}")
        else:
            print(f"   ❌ {file} NOT FOUND")
            all_exist = False
    
    return all_exist


def main():
    """Run all verification tests"""
    print("=" * 70)
    print("   RBAC IMPLEMENTATION VERIFICATION")
    print("=" * 70)
    
    results = []
    
    # Run tests
    results.append(("File Structure", verify_file_structure()))
    results.append(("Module Imports", test_imports()))
    results.append(("UserRole Enum", test_user_role_enum()))
    results.append(("CurrentUser Methods", test_current_user_methods()))
    results.append(("Custom Exceptions", test_exceptions()))
    results.append(("Role Guards", test_role_guards()))
    
    # Summary
    print("\n" + "=" * 70)
    print("   SUMMARY")
    print("=" * 70)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status:10} - {test_name}")
    
    print(f"\n   Total: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n   🎉 ALL TESTS PASSED! RBAC is fully implemented and functional!")
        return 0
    else:
        print(f"\n   ⚠️  {total - passed} test(s) failed. Please review errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())

