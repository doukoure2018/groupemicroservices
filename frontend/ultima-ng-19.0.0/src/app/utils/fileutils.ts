export const server = 'http://localhost:9000';

export const authorizationServer = 'http://localhost:8090';

export const tokenEndpoint = 'http://localhost:8090/oauth2/token';

export const redirectUri = 'http://localhost:4202';

export const loginUrl = `${authorizationServer}/oauth2/authorize?response_type=code&client_id=client&scope=openid&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=vesLhZA4cwKsKZAR7zvEJ9q3uI6dRM8nwna-IpuKkkk`;

export const getFormData = (formValue: any, files?: File[]): FormData => {
    const formData = new FormData();
    for (const property in formValue) {
        formData.append(property, formValue[property]);
    }

    if (files && files.length > 0) {
        files.forEach((file) => formData.append('files', file, file.name));
    }

    return formData;
};
