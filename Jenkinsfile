node {
    def app
    stage('Clone repository') {
        checkout scm
    }

    stage('Build image') {  
        if (env.BRANCH_NAME == 'main') {
            app = docker.build("bduke97/parts_website")
        }
        else {
            app = docker.build("bduke97/parts_website", "-f ./Dockerfile.uat .")
        }
       
    }

    /*
    stage('Test image') {
  

        app.inside {
            sh 'echo "Tests passed"'
        }
    }
    */

    stage('Push image') {
        if (env.BRANCH_NAME != 'main') {
            docker.withRegistry('https://registry.hub.docker.com', 'dockerhub') {
                app.push("${env.BUILD_NUMBER}")
                app.push("latest")
            }
        }  
    }

    stage('Deploy') {
        if (env.BRANCH_NAME == 'main') {
            /*withCredentials([usernamePassword(credentialsId: 'parts-server', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                app.inside {
                    sh '''
                    sshpass -p "$PASS" sftp -o StrictHostKeyChecking=no "$USER"@vhost90-public.wvnet.edu:public_html/ <<EOF
                    ls
                    EOF
                    '''
                }
            }*/

            withCredentials([usernamePassword(credentialsId: 'parts-server', usernameVariable: 'USER', passwordVariable: 'PASS')]) {
                 app.inside {
                    sh '''
                    mkdir ~/.ssh && touch ~/.ssh/known_hosts && ssh-keyscan -H vhost90-public.wvnet.edu >> ~/.ssh/known_hosts
                    '''
                        
                    sh '''
                    python3 delete_remote_files.py vhost90-public.wvnet.edu "$USER" "$PASS" /public_html/
                    '''

                    sh '''
                    rm delete_remote_files.py
                    '''

                    sh '''
                    python3 upload_directory.py vhost90-public.wvnet.edu "$USER" "$PASS" ./ /public_html/
                    '''
                }
            }
        }
        else {
            sh '''
            ssh -o StrictHostKeyChecking=no brandon@192.168.1.41 "cd /home/brandon/PARTs_Website && docker stop parts_website_uat && docker rm parts_website_uat && docker compose up -d"
            '''
        } 
    }
}